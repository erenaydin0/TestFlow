/**
 * Test routes
 */

import express, { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

import { getTestFilePath } from '../utils/fileUtils.js';
import { validateTestRequest } from '../middleware/validation.js';
import errorHandler from '../services/errorHandler.js';
import logger from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { Test } from '@shared/types/index.js';
import { WebSocketService } from '../core/websocket.js';

// Helper to map DB test to API test
const mapTestFromDb = (dbTest: any): Test => {
    return {
        ...dbTest,
        tags: JSON.parse(dbTest.tags || '[]'),
        workflow: JSON.parse(dbTest.workflow || '[]'),
        createdAt: new Date(dbTest.createdAt),
        updatedAt: new Date(dbTest.updatedAt)
    };
};

/**
 * Create test routes instance
 */
function createTestRoutes(storageDirs: any, webSocketService: WebSocketService) {
    const { TESTS_DIR } = storageDirs;

    // Get all tests
    router.get('/', async (req: Request, res: Response) => {
        try {
            const workspaceId = req.headers['x-workspace-id'] as string;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID is required' });
            }

            const tests = await prisma.test.findMany({
                where: { workspaceId },
                orderBy: { updatedAt: 'desc' }
            });

            res.json(tests.map(mapTestFromDb));
        } catch (error: any) {
            logger.error('Error getting tests:', { error: error.message });
            res.status(500).json({ error: 'Failed to get tests' });
        }
    });

    // Get single test
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const test = await prisma.test.findUnique({
                where: { id }
            });

            if (test) {
                res.json(mapTestFromDb(test));
            } else {
                res.status(404).json({ error: 'Test not found' });
            }
        } catch (error: any) {
            logger.error('Error getting test:', { error: error.message, testId: req.params.id });
            res.status(500).json({ error: 'Failed to get test' });
        }
    });

    // Create or update test
    router.post('/', validateTestRequest, async (req: Request, res: Response) => {
        try {
            const workspaceId = req.headers['x-workspace-id'] as string;

            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID is required' });
            }

            const testData = req.validatedData;
            const testId = req.body.id || uuidv4();

            const dbData = {
                id: testId,
                name: testData.name,
                description: testData.description || '',
                status: testData.status || 'draft',
                duration: testData.duration || 0,
                tags: JSON.stringify(testData.tags || []),
                suite: testData.suite || 'Default',
                workflow: JSON.stringify(testData.workflow || []),
                isExecutable: testData.isExecutable ?? true,
                enableScreenshots: testData.enableScreenshots ?? false,
                enableRecording: testData.enableRecording ?? false,
                headlessMode: testData.headlessMode ?? false,
                browserType: testData.browserType || 'chromium',
                workspaceId: workspaceId,
                createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
                updatedAt: new Date()
            };

            // Upsert to handle both create and update if ID exists (though POST is usually create)
            // But frontend might send ID for duplication or specific logic.
            // Original code just overwrote the file.
            const savedTest = await prisma.test.upsert({
                where: { id: testId },
                update: { ...dbData, createdAt: undefined }, // Don't update createdAt
                create: dbData
            });

            const test = mapTestFromDb(savedTest);

            webSocketService.broadcast({
                type: 'test:saved',
                test
            });

            res.json(test);
        } catch (error: any) {
            logger.error('Error saving test:', { error: error.message });
            res.status(500).json({ error: 'Failed to save test' });
        }
    });

    // Update test
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if exists
            const existingTest = await prisma.test.findUnique({ where: { id } });

            if (existingTest) {
                const updateData = {
                    ...req.body,
                    updatedAt: new Date()
                };

                // Handle JSON fields if they are in the update
                if (updateData.tags) updateData.tags = JSON.stringify(updateData.tags);
                if (updateData.workflow) updateData.workflow = JSON.stringify(updateData.workflow);

                // Remove fields that shouldn't be updated directly or need transformation
                delete updateData.id;
                delete updateData.createdAt;

                const updated = await prisma.test.update({
                    where: { id },
                    data: updateData
                });

                const test = mapTestFromDb(updated);

                webSocketService.broadcast({
                    type: 'test:updated',
                    test
                });

                res.json(test);
            } else {
                res.status(404).json({ error: 'Test not found' });
            }
        } catch (error: any) {
            logger.error('Error updating test:', { error: error.message, testId: req.params.id });
            res.status(500).json({ error: 'Failed to update test' });
        }
    });

    // Delete test
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            try {
                await prisma.test.delete({
                    where: { id }
                });

                webSocketService.broadcast({
                    type: 'test:deleted',
                    testId: id
                });

                res.json({ success: true, message: 'Test deleted successfully' });
            } catch (dbError: any) {
                if (dbError.code === 'P2025') {
                    res.status(404).json({ error: 'Test not found' });
                } else {
                    throw dbError;
                }
            }
        } catch (error: any) {
            logger.error('Error deleting test:', { error: error.message, testId: req.params.id });
            res.status(500).json({ error: 'Failed to delete test' });
        }
    });

    return router;
}

export default createTestRoutes;
