/**
 * Scheduled test routes
 */

import express, { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

import { getScheduledTestFilePath } from '../utils/fileUtils.js';
import { validateScheduledTestRequest } from '../middleware/validation.js';
import errorHandler from '../services/errorHandler.js';
import logger from '../utils/logger.js';
import TestScheduler from '../core/scheduler.js';
import { prisma } from '../lib/prisma.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { WebSocketService } from '../core/websocket.js';
import { Schedule } from '@shared/types/index.js';

// Helper to map DB schedule to API schedule
const mapScheduleFromDb = (dbSchedule: any): Schedule => {
    return {
        ...dbSchedule,
        lastRun: dbSchedule.lastRun ? new Date(dbSchedule.lastRun) : undefined,
        nextRun: dbSchedule.nextRun ? new Date(dbSchedule.nextRun) : undefined,
        createdAt: new Date(dbSchedule.createdAt),
        updatedAt: new Date(dbSchedule.updatedAt)
    };
};

/**
 * Create scheduled test routes instance
 */
function createScheduledRoutes(storageDirs: any, webSocketService: WebSocketService, testScheduler: TestScheduler) {
    const { SCHEDULED_TESTS_DIR } = storageDirs;

    // Get all scheduled tests
    router.get('/', async (req: Request, res: Response) => {
        try {
            const workspaceId = req.headers['x-workspace-id'] as string;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID is required' });
            }

            const dbSchedules = await prisma.scheduledTest.findMany({
                where: { workspaceId },
                orderBy: { nextRun: 'asc' }
            });

            const scheduledTests = dbSchedules.map(mapScheduleFromDb);

            // Calculate upcoming runs
            const upcomingRuns = scheduledTests
                .filter(s => s.enabled && s.status === 'active' && s.nextRun)
                .slice(0, 5)
                .map(s => ({
                    id: uuidv4(),
                    scheduledTestId: s.id,
                    testName: s.name,
                    scheduledTime: s.nextRun!,
                    estimatedDuration: s.lastDuration || 0,
                    environment: s.environment
                }));

            res.json({ scheduledTests, upcomingRuns });
        } catch (error: any) {
            logger.error('Error getting scheduled tests:', { error: error.message });
            res.status(500).json({ error: 'Failed to get scheduled tests' });
        }
    });

    // Get single scheduled test
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const schedule = await prisma.scheduledTest.findUnique({
                where: { id }
            });

            if (schedule) {
                res.json(mapScheduleFromDb(schedule));
            } else {
                res.status(404).json({ error: 'Scheduled test not found' });
            }
        } catch (error: any) {
            logger.error('Error getting scheduled test:', { error: error.message, scheduleId: req.params.id });
            res.status(500).json({ error: 'Failed to get scheduled test' });
        }
    });

    // Create scheduled test
    router.post('/', validateScheduledTestRequest, async (req: Request, res: Response) => {
        try {
            const workspaceId = req.headers['x-workspace-id'] as string;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID is required' });
            }

            const scheduleData = req.validatedData;
            const scheduleId = uuidv4();

            // Calculate next run time based on cron expression
            let nextRun = null;
            if (testScheduler) {
                try {
                    nextRun = testScheduler.calculateNextRun(scheduleData.schedule);
                } catch (e) {
                    nextRun = new Date(Date.now() + 60 * 60 * 1000); // Fallback 1 hour
                }
            } else {
                nextRun = new Date(Date.now() + 60 * 60 * 1000);
            }

            const dbData = {
                id: scheduleId,
                testId: scheduleData.testId,
                name: scheduleData.name,
                description: scheduleData.description || '',
                schedule: scheduleData.schedule,
                frequency: scheduleData.frequency || 'custom',
                status: 'active',
                suite: scheduleData.suite || 'Default',
                environment: scheduleData.environment || 'development',
                enabled: true,
                notifyOnFailure: scheduleData.notifyOnFailure ?? false,
                notifyOnSuccess: scheduleData.notifyOnSuccess ?? false,
                retryOnFailure: scheduleData.retryOnFailure ?? false,
                maxRetries: scheduleData.maxRetries || 0,
                nextRun: nextRun,
                lastRun: null,
                lastDuration: null,
                successRate: null,
                workspaceId: workspaceId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const savedSchedule = await prisma.scheduledTest.create({
                data: dbData
            });

            const schedule = mapScheduleFromDb(savedSchedule);

            // Scheduler'a ekle
            if (testScheduler) {
                testScheduler.scheduleTest(schedule);
            }

            // Send to specific workspace or broadcast for legacy data
            if (schedule.workspaceId) {
                webSocketService.sendToWorkspace(schedule.workspaceId, {
                    type: 'schedule:created',
                    schedule
                });
            } else {
                // Fallback for legacy data without workspaceId
                webSocketService.broadcast({
                    type: 'schedule:created',
                    schedule
                });
            }

            res.json(schedule);
        } catch (error: any) {
            logger.error('Error creating scheduled test:', { error: error.message });
            res.status(500).json({ error: 'Failed to create scheduled test' });
        }
    });

    // Update scheduled test
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const existingSchedule = await prisma.scheduledTest.findUnique({ where: { id } });

            if (existingSchedule) {
                const updateData = {
                    ...req.body,
                    updatedAt: new Date()
                };

                // Eğer schedule değiştiyse nextRun'ı yeniden hesapla
                if (req.body.schedule && req.body.schedule !== existingSchedule.schedule) {
                    if (testScheduler) {
                        try {
                            updateData.nextRun = testScheduler.calculateNextRun(req.body.schedule);
                        } catch (e) {
                            // Keep existing or set to null?
                        }
                    }
                }

                // Remove fields that shouldn't be updated directly
                delete updateData.id;
                delete updateData.createdAt;

                const updated = await prisma.scheduledTest.update({
                    where: { id },
                    data: updateData
                });

                const schedule = mapScheduleFromDb(updated);

                // Scheduler'ı güncelle
                if (testScheduler) {
                    await testScheduler.reloadSchedule(id);
                }

                // Send to specific workspace or broadcast for legacy data
                if (schedule.workspaceId) {
                    webSocketService.sendToWorkspace(schedule.workspaceId, {
                        type: 'schedule:updated',
                        schedule
                    });
                } else {
                    // Fallback for legacy data without workspaceId
                    webSocketService.broadcast({
                        type: 'schedule:updated',
                        schedule
                    });
                }

                res.json(schedule);
            } else {
                res.status(404).json({ error: 'Scheduled test not found' });
            }
        } catch (error: any) {
            logger.error('Error updating scheduled test:', { error: error.message, scheduleId: req.params.id });
            res.status(500).json({ error: 'Failed to update scheduled test' });
        }
    });

    // Delete scheduled test
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Get workspaceId before deletion for notification
            const scheduleToDelete = await prisma.scheduledTest.findUnique({
                where: { id },
                select: { workspaceId: true }
            });

            try {
                // Scheduler'dan kaldır
                if (testScheduler) {
                    testScheduler.unscheduleTest(id);
                }

                await prisma.scheduledTest.delete({
                    where: { id }
                });

                // Send deletion notification to specific workspace only
                if (scheduleToDelete?.workspaceId) {
                    webSocketService.sendToWorkspace(scheduleToDelete.workspaceId, {
                        type: 'schedule:deleted',
                        scheduleId: id
                    });
                }

                res.json({ message: 'Scheduled test deleted successfully' });
            } catch (dbError: any) {
                if (dbError.code === 'P2025') {
                    res.status(404).json({ error: 'Scheduled test not found' });
                } else {
                    throw dbError;
                }
            }
        } catch (error: any) {
            logger.error('Error deleting scheduled test:', { error: error.message, scheduleId: req.params.id });
            res.status(500).json({ error: 'Failed to delete scheduled test' });
        }
    });

    return router;
}

export default createScheduledRoutes;
