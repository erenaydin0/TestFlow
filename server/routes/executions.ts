/**
 * Execution routes
 */

import express, { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

import { generateReadableExecutionId } from '../utils/timestamp.js';
import { getExecutionFilePath } from '../utils/fileUtils.js';
import { calculateSuccessRate, hasFailedSteps } from '../utils/executionUtils.js';
import { validateExecutionRequest } from '../middleware/validation.js';
import errorHandler from '../services/errorHandler.js';
import logger from '../utils/logger.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { Execution } from '../types/models.js';

/**
 * Create execution service instance
 */
function createExecutionRoutes(activeExecutions: Map<string, Execution>, clients: Set<any>, broadcast: Function, executeTestWorkflow: Function, storageDirs: any) {
    const { EXECUTIONS_DIR, SCREENSHOTS_DIR, VIDEOS_DIR } = storageDirs;

    // Execute test workflow
    router.post('/execute', validateExecutionRequest, async (req: Request, res: Response) => {
        try {
            const { workflowId, workflowName, steps, suite, tags, options } = req.validatedData;

            // Generate execution ID and create execution object
            const baseTimestamp = new Date();
            const executionId = generateReadableExecutionId(workflowName, workflowId, baseTimestamp);

            const execution: Execution = {
                id: executionId,
                workflowId,
                workflowName,
                status: 'queued',
                startTime: baseTimestamp,
                suite,
                tags,
                options: {
                    enableScreenshots: options.enableScreenshots || false,
                    enableRecording: options.enableRecording || false,
                    headlessMode: options.headlessMode || process.env.HEADLESS_MODE === 'true' || false,
                    browserType: options.browserType || process.env.DEFAULT_BROWSER || 'chromium'
                },
                steps: steps.map((step: any) => ({
                    stepId: step.id,
                    type: step.type,
                    status: 'pending',
                    config: step.config
                })),
                screenshots: [],
                logs: [],
                progress: 0
            };

            activeExecutions.set(executionId, execution);

            // Save execution to file
            await fs.writeJson(getExecutionFilePath(EXECUTIONS_DIR, executionId), execution);

            // Start execution asynchronously
            executeTestWorkflow(executionId, execution);

            res.json({ executionId, status: 'queued' });
        } catch (error: any) {
            await errorHandler.logError(error, {
                executionId: req.body.workflowId,
                endpoint: '/api/execute'
            });
            res.status(500).json(errorHandler.formatApiError(error, {
                // @ts-ignore
                requestId: req.id,
                endpoint: '/api/execute'
            }));
        }
    });

    // Get execution status
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check active executions first
            if (activeExecutions.has(id)) {
                return res.json(activeExecutions.get(id));
            }

            // Check saved executions
            const executionPath = getExecutionFilePath(EXECUTIONS_DIR, id);
            if (await fs.pathExists(executionPath)) {
                const execution = await fs.readJson(executionPath);
                return res.json(execution);
            }

            res.status(404).json(errorHandler.formatApiError(
                new Error('Execution not found'),
                { executionId: req.params.id, endpoint: '/api/execution/:id' }
            ));
        } catch (error: any) {
            await errorHandler.logError(error, {
                executionId: req.params.id,
                endpoint: '/api/execution/:id'
            });
            res.status(500).json(errorHandler.formatApiError(error, {
                // @ts-ignore
                requestId: req.id,
                endpoint: '/api/execution/:id'
            }));
        }
    });

    // Get execution results
    router.get('/results/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const executionPath = getExecutionFilePath(EXECUTIONS_DIR, id);
            if (await fs.pathExists(executionPath)) {
                const execution = await fs.readJson(executionPath);
                res.json(execution);
            } else {
                res.status(404).json({ error: 'Results not found' });
            }
        } catch (error: any) {
            logger.error('Error getting execution results', {
                executionId: req.params.id,
                error: error.message
            });
            res.status(500).json({ error: 'Failed to get results' });
        }
    });

    // Get all execution results
    router.get('/', async (req: Request, res: Response) => {
        try {
            const files = await fs.readdir(EXECUTIONS_DIR);
            const executions = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const executionPath = getExecutionFilePath(EXECUTIONS_DIR, file.replace('.json', ''));
                        const execution = await fs.readJson(executionPath);
                        executions.push(execution);
                    } catch (error: any) {
                        logger.error('Error reading execution file', {
                            file,
                            error: error.message
                        });
                    }
                }
            }

            // Sort by startTime (newest first)
            executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            res.json(executions);
        } catch (error: any) {
            logger.error('Error getting executions', { error: error.message });
            res.status(500).json({ error: 'Failed to get executions' });
        }
    });

    // Cancel execution
    router.delete('/cancel/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (activeExecutions.has(id)) {
                const execution = activeExecutions.get(id);
                if (execution) {
                    execution.status = 'cancelled';
                    execution.endTime = new Date();

                    // Save final state
                    await fs.writeJson(getExecutionFilePath(EXECUTIONS_DIR, id), execution);

                    activeExecutions.delete(id);

                    // Broadcast cancellation
                    broadcast({
                        type: 'execution:cancelled',
                        executionId: id,
                        execution
                    });

                    res.json({ message: 'Execution cancelled' });
                }
            } else {
                res.status(404).json({ error: 'Execution not found or already completed' });
            }
        } catch (error: any) {
            logger.error('Error cancelling execution', {
                executionId: req.params.id,
                error: error.message
            });
            res.status(500).json({ error: 'Failed to cancel execution' });
        }
    });

    // Delete execution record
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Remove from active executions if exists
            if (activeExecutions.has(id)) {
                activeExecutions.delete(id);
            }

            // Delete execution file
            const executionPath = getExecutionFilePath(EXECUTIONS_DIR, id);
            if (await fs.pathExists(executionPath)) {
                await fs.remove(executionPath);

                // Also try to delete associated media files
                try {
                    // Delete screenshots directory for this execution
                    const screenshotDir = path.join(SCREENSHOTS_DIR, id);
                    if (await fs.pathExists(screenshotDir)) {
                        await fs.remove(screenshotDir);
                    }

                    // Delete video file for this execution
                    const videoPath = path.join(VIDEOS_DIR, `${id}.webm`);
                    if (await fs.pathExists(videoPath)) {
                        await fs.remove(videoPath);
                    }
                } catch (mediaError: any) {
                    logger.error('Error deleting media files', {
                        executionId: id,
                        error: mediaError.message
                    });
                    // Continue even if media deletion fails
                }

                broadcast({
                    type: 'execution:deleted',
                    executionId: id
                });

                res.json({ message: 'Execution deleted successfully' });
            } else {
                res.status(404).json({ error: 'Execution not found' });
            }
        } catch (error: any) {
            logger.error('Error deleting execution', {
                executionId: req.params.id,
                error: error.message
            });
            res.status(500).json({ error: 'Failed to delete execution' });
        }
    });

    return router;
}

export default createExecutionRoutes;
