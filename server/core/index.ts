import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import TestRunner from './testRunner.js';
import webSocketService from './websocket.js';

import TestScheduler from './scheduler.js';
import errorHandler from '../services/errorHandler.js';
import healthChecker from '../services/healthChecker.js';
import logger from '../utils/logger.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utils
import { ensureDirectoriesExist } from '../utils/fileUtils.js';
import { generateScheduledExecutionId } from '../utils/timestamp.js';
import { calculateSuccessRate, hasFailedSteps } from '../utils/executionUtils.js';
import { Execution, Schedule, TestStep } from '@shared/types/index.js';

// Routes
import createExecutionRoutes from '../routes/executions.js';
import createTestRoutes from '../routes/tests.js';
import createScheduledRoutes from '../routes/scheduled.js';
import createHealthRoutes from '../routes/health.js';
import errorRoutes from '../routes/errors.js';

// Error middleware
import {
    globalErrorHandler,
    notFoundHandler,
    validationErrorHandler,
    jwtErrorHandler,
    rateLimitErrorHandler,
    errorRecoveryMiddleware
} from '../middleware/errorMiddleware.js';

const app: Express = express();
const server = createServer(app);

// Initialize WebSocket Service
webSocketService.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware (order matters!)
app.use(validationErrorHandler);
app.use(jwtErrorHandler);
app.use(rateLimitErrorHandler);
app.use(errorRecoveryMiddleware);

// Storage paths
const storageDirs = {
    EXECUTIONS_DIR: path.join(__dirname, '../storage/executions'),
    SCREENSHOTS_DIR: path.join(__dirname, '../storage/screenshots'),
    VIDEOS_DIR: path.join(__dirname, '../storage/videos'),
    SCHEDULED_TESTS_DIR: path.join(__dirname, '../storage/scheduled-tests'),
    TESTS_DIR: path.join(__dirname, '../storage/tests')
};

// Ensure directories exist
ensureDirectoriesExist(storageDirs);

// In-memory storage for active executions
const activeExecutions = new Map<string, Execution>();

// Test Scheduler instance - initialize early
const testScheduler = new TestScheduler(executeScheduledTest, storageDirs.SCHEDULED_TESTS_DIR);

// Execute scheduled test function
async function executeScheduledTest(schedule: Schedule) {
    logger.info('Scheduled test starting', {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        testId: schedule.testId
    });

    try {
        // Test workflow'unu backend'den yükle
        const testPath = path.join(storageDirs.TESTS_DIR, `${schedule.testId}.json`);

        if (!await fs.pathExists(testPath)) {
            logger.error('Scheduled test: Test not found', {
                scheduleId: schedule.id,
                testId: schedule.testId
            });
            return null;
        }

        const testWorkflow = await fs.readJson(testPath);

        if (!testWorkflow || !testWorkflow.workflow || testWorkflow.workflow.length === 0) {
            logger.error('Scheduled test: Test workflow is empty', {
                scheduleId: schedule.id,
                testId: schedule.testId
            });
            return null;
        }

        // Tek timestamp oluştur ve hem ID hem startTime için kullan
        const baseTimestamp = new Date();
        const executionId = generateScheduledExecutionId(schedule.testId, baseTimestamp);

        // Execution objesi oluştur
        const execution: Execution = {
            id: executionId,
            workflowId: schedule.testId,
            workflowName: schedule.name,
            status: 'queued',
            startTime: baseTimestamp,
            suite: schedule.suite,
            tags: ['scheduled'],
            options: {
                enableScreenshots: false,
                enableRecording: false,
                headlessMode: process.env.HEADLESS_MODE === 'true' || true,
                browserType: process.env.DEFAULT_BROWSER || 'chromium'
            },
            steps: testWorkflow.workflow.map((step: any): TestStep => ({
                stepId: step.id,
                type: step.type,
                status: 'pending',
                config: step
            })),
            screenshots: [],
            logs: [],
            progress: 0,
            scheduledTestId: schedule.id
        };

        activeExecutions.set(executionId, execution);

        // Execution'ı kaydet
        await fs.writeJson(path.join(storageDirs.EXECUTIONS_DIR, `${executionId}.json`), execution);

        // Broadcast başlangıç
        webSocketService.broadcast({
            type: 'execution:scheduled',
            executionId,
            execution,
            scheduleName: schedule.name
        });

        console.log(`✅ Zamanlanmış test başlatıldı: ${executionId} (${execution.steps.length} adım)`);

        // Test'i asenkron olarak çalıştır (blocking olmadan)
        setImmediate(() => {
            executeTestWorkflow(executionId, execution).catch(error => {
                logger.error('Scheduled test execution error', {
                    executionId,
                    scheduleId: schedule.id,
                    error: error.message
                });
            });
        });

        return executionId;
    } catch (error: any) {
        logger.error('Scheduled test execution failed', {
            scheduleId: schedule.id,
            error: error.message
        });
        throw error;
    }
}

// Test execution function
async function executeTestWorkflow(executionId: string, execution: Execution) {
    try {
        execution.status = 'running';

        // Broadcast start
        webSocketService.broadcast({
            type: 'execution:started',
            executionId,
            execution
        });

        // Execute with Playwright
        const testRunner = new TestRunner(storageDirs.SCREENSHOTS_DIR);

        // Initialize browser with options
        await testRunner.initializeBrowser({
            enableRecording: execution.options.enableRecording,
            executionId: executionId,
            headless: execution.options.headlessMode,
            browserType: execution.options.browserType || 'chromium'
        });

        // Execute steps sequentially (linear flow)
        logger.info('Execution starting', {
            executionId,
            stepCount: execution.steps.length,
            workflowName: execution.workflowName
        });

        for (let i = 0; i < execution.steps.length; i++) {
            const step = execution.steps[i];

            if ((execution.status as string) === 'cancelled') {
                break;
            }

            step.status = 'running';
            step.startTime = new Date();

            // Broadcast step start
            webSocketService.broadcast({
                type: 'step:started',
                executionId,
                stepIndex: i,
                step
            });

            try {
                // Execute step with options
                const result = await testRunner.executeStep(step, executionId, execution.options);

                step.status = result.success ? 'passed' : 'failed';
                step.endTime = new Date();
                step.duration = step.endTime.getTime() - step.startTime.getTime();

                if (result.screenshot) {
                    step.screenshot = result.screenshot;
                    execution.screenshots.push(result.screenshot);
                }

                if (result.error) {
                    step.error = result.error;
                }

                if (result.logs) {
                    execution.logs.push(...result.logs);
                }

                // Update progress
                execution.progress = Math.round(((i + 1) / execution.steps.length) * 100);

                // Broadcast step completion
                webSocketService.broadcast({
                    type: 'step:completed',
                    executionId,
                    stepIndex: i,
                    step,
                    progress: execution.progress
                });

                // If step failed and it's critical, stop execution
                if (!result.success && step.config.critical !== false) {
                    execution.status = 'failed';
                    execution.error = errorHandler.createSafeErrorMessage(
                        new Error(result.error || 'Unknown error'),
                        { stepIndex: i, stepId: step.stepId }
                    );
                    break;
                }

            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error(String(error));
                step.status = 'failed';
                step.endTime = new Date();
                step.duration = step.endTime.getTime() - step.startTime.getTime();
                step.error = errorHandler.createSafeErrorMessage(err, { stepIndex: i });

                execution.status = 'failed';
                execution.error = errorHandler.createSafeErrorMessage(err, { stepIndex: i });

                // Log detaylı hata
                await errorHandler.logError(err, {
                    executionId,
                    stepIndex: i,
                    stepId: step.stepId
                });

                webSocketService.broadcast({
                    type: 'step:failed',
                    executionId,
                    stepIndex: i,
                    step,
                    error: errorHandler.createSafeErrorMessage(err, { stepIndex: i })
                });

                break;
            }
        }

        // Finalize execution - check if any steps failed
        if (execution.status === 'running') {
            execution.status = hasFailedSteps(execution.steps) ? 'failed' : 'completed';
        }

        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

        // Calculate success rate
        execution.successRate = calculateSuccessRate(execution.steps);

        // Close browser and save video
        const originalVideoPath = await testRunner.closeBrowser();

        // Add video path if recording was enabled
        if (execution.options.enableRecording && originalVideoPath) {
            try {
                // Rename video file to match executionId
                const newVideoPath = path.join(storageDirs.VIDEOS_DIR, `${executionId}.webm`);

                // Check if original video file exists
                if (await fs.pathExists(originalVideoPath)) {
                    // Move/rename the file
                    await fs.move(originalVideoPath, newVideoPath, { overwrite: true });
                    execution.videoPath = `/videos/${executionId}.webm`;
                    logger.debug('Video file renamed', {
                        executionId,
                        originalPath: originalVideoPath,
                        newPath: newVideoPath
                    });
                } else {
                    logger.warn('Original video file not found', {
                        executionId,
                        originalPath: originalVideoPath
                    });
                }
            } catch (error: any) {
                logger.error('Error renaming video file', {
                    executionId,
                    error: error.message
                });
            }
        }

        // Save final execution state with video path
        await fs.writeJson(path.join(storageDirs.EXECUTIONS_DIR, `${executionId}.json`), execution);

        // Clean up from active executions
        activeExecutions.delete(executionId);

        // Broadcast completion or failure based on status
        webSocketService.broadcast({
            type: execution.status === 'failed' ? 'execution:failed' : 'execution:completed',
            executionId,
            execution,
            error: execution.error
        });

        logger.info('Execution completed', {
            executionId,
            status: execution.status,
            duration: execution.duration,
            successRate: execution.successRate
        });

    } catch (error: any) {
        logger.error('Execution failed', {
            executionId,
            error: error.message,
            stack: error.stack
        });

        execution.status = 'failed';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        execution.error = errorHandler.createSafeErrorMessage(error, { executionId });

        // Log detaylı hata
        await errorHandler.logError(error, { executionId });

        // Save error state
        await fs.writeJson(path.join(storageDirs.EXECUTIONS_DIR, `${executionId}.json`), execution);

        activeExecutions.delete(executionId);

        // Broadcast failure
        webSocketService.broadcast({
            type: 'execution:failed',
            executionId,
            execution,
            error: errorHandler.createSafeErrorMessage(error, { executionId })
        });
    }
}

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'CosmicQA Backend API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        docs: '/api-docs' // Placeholder for future docs
    });
});

// Setup routes
app.use('/api/executions', createExecutionRoutes(activeExecutions, webSocketService, executeTestWorkflow, storageDirs));
app.use('/api/tests', createTestRoutes(storageDirs, webSocketService));
app.use('/api/scheduled-tests', createScheduledRoutes(storageDirs, webSocketService, testScheduler));
app.use('/api/health', createHealthRoutes(activeExecutions, webSocketService, testScheduler, healthChecker));
app.use('/api/errors', errorRoutes);

// Serve screenshots and videos
app.use('/screenshots', express.static(storageDirs.SCREENSHOTS_DIR));
app.use('/videos', express.static(storageDirs.VIDEOS_DIR));

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 3004;
server.listen(PORT, async () => {
    logger.info('CosmicQA Backend Server started', {
        port: PORT,
        healthCheck: `http://localhost:${PORT}/api/health`,
        environment: config.nodeEnv,
        nodeVersion: process.version
    });

    // Initialize Test Scheduler
    await testScheduler.initialize();

    // Fix existing schedules' nextRun values
    await testScheduler.fixExistingSchedules();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Shutting down server...');

    // Stop all scheduled tasks
    if (testScheduler) {
        testScheduler.stopAll();
    }

    // Close WebSocket server
    webSocketService.close();

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('Shutting down server (SIGTERM)...');

    // Stop all scheduled tasks
    if (testScheduler) {
        testScheduler.stopAll();
    }

    // Close WebSocket server
    webSocketService.close();

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
