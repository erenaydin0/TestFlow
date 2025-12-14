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
import { prisma } from '../lib/prisma.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { Execution } from '@shared/types/index.js';

/**
 * Create execution service instance
 */
import { WebSocketService } from '../core/websocket.js';

// Helper to map DB execution to API execution
const mapExecutionFromDb = (dbExecution: any): Execution => {
    return {
        ...dbExecution,
        tags: JSON.parse(dbExecution.tags || '[]'),
        options: JSON.parse(dbExecution.options || '{}'),
        steps: JSON.parse(dbExecution.steps || '[]'),
        screenshots: JSON.parse(dbExecution.screenshots || '[]'),
        logs: JSON.parse(dbExecution.logs || '[]'),
        startTime: new Date(dbExecution.startTime),
        endTime: dbExecution.endTime ? new Date(dbExecution.endTime) : undefined
    };
};

/**
 * Create execution service instance
 */
function createExecutionRoutes(activeExecutions: Map<string, Execution>, webSocketService: WebSocketService, executeTestWorkflow: Function, storageDirs: any) {
    const { EXECUTIONS_DIR, SCREENSHOTS_DIR, VIDEOS_DIR } = storageDirs;

    // Execute test workflow
    router.post('/execute', validateExecutionRequest, async (req: Request, res: Response) => {
        try {
            const workspaceId = req.headers['x-workspace-id'] as string;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID is required' });
            }

            const { workflowId, workflowName, steps, suite, tags, options } = req.validatedData;

            // Generate execution ID and create execution object
            const baseTimestamp = new Date();
            const executionId = generateReadableExecutionId(workflowName, workflowId, baseTimestamp);

            const executionData = {
                id: executionId,
                workflowId,
                workflowName,
                status: 'queued',
                startTime: baseTimestamp,
                suite,
                tags: JSON.stringify(tags || []),
                options: JSON.stringify({
                    enableScreenshots: options.enableScreenshots || false,
                    enableRecording: options.enableRecording || false,
                    headlessMode: options.headlessMode || process.env.HEADLESS_MODE === 'true' || false,
                    browserType: options.browserType || process.env.DEFAULT_BROWSER || 'chromium'
                }),
                steps: JSON.stringify(steps.map((step: any) => ({
                    stepId: step.id,
                    type: step.type,
                    status: 'pending',
                    config: step.config
                }))),
                screenshots: '[]',
                logs: '[]',
                progress: 0,
                workspaceId: workspaceId
            };

            // Save execution to DB
            const savedExecution = await prisma.execution.create({
                data: executionData
            });

            const execution = mapExecutionFromDb(savedExecution);
            activeExecutions.set(executionId, execution);

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

            // Check DB
            const execution = await prisma.execution.findUnique({
                where: { id }
            });

            if (execution) {
                return res.json(mapExecutionFromDb(execution));
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

            const execution = await prisma.execution.findUnique({
                where: { id }
            });

            if (execution) {
                res.json(mapExecutionFromDb(execution));
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
            const workspaceId = req.headers['x-workspace-id'] as string;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID is required' });
            }

            const executions = await prisma.execution.findMany({
                where: { workspaceId },
                orderBy: { startTime: 'desc' }
            });

            res.json(executions.map(mapExecutionFromDb));
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

                    // Save final state to DB
                    await prisma.execution.update({
                        where: { id },
                        data: {
                            status: 'cancelled',
                            endTime: execution.endTime,
                            steps: JSON.stringify(execution.steps),
                            logs: JSON.stringify(execution.logs),
                            screenshots: JSON.stringify(execution.screenshots)
                        }
                    });

                    activeExecutions.delete(id);

                    // Send cancellation to specific workspace only
                    if (execution.workspaceId) {
                        webSocketService.sendToWorkspace(execution.workspaceId, {
                            type: 'execution:cancelled',
                            executionId: id,
                            execution
                        });
                    }

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

            // Get workspaceId before deletion for notification
            const executionToDelete = await prisma.execution.findUnique({
                where: { id },
                select: { workspaceId: true }
            });

            // Delete from DB
            // Prisma will throw if not found, so we check first or handle error
            try {
                await prisma.execution.delete({
                    where: { id }
                });

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

                // Send deletion notification to specific workspace only
                if (executionToDelete?.workspaceId) {
                    webSocketService.sendToWorkspace(executionToDelete.workspaceId, {
                        type: 'execution:deleted',
                        executionId: id
                    });
                }

                res.json({ message: 'Execution deleted successfully' });
            } catch (dbError: any) {
                if (dbError.code === 'P2025') { // Record to delete does not exist
                    res.status(404).json({ error: 'Execution not found' });
                } else {
                    throw dbError;
                }
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
