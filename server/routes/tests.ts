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

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { WebSocketService } from '../core/websocket.js';

/**
 * Create test routes instance
 */
function createTestRoutes(storageDirs: any, webSocketService: WebSocketService) {
    const { TESTS_DIR } = storageDirs;

    // Get all tests
    router.get('/', async (req: Request, res: Response) => {
        try {
            const files = await fs.readdir(TESTS_DIR);
            const tests = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const testPath = getTestFilePath(TESTS_DIR, file.replace('.json', ''));
                        const test = await fs.readJson(testPath);
                        tests.push(test);
                    } catch (error: any) {
                        logger.error(`Error reading test file ${file}:`, { error: error.message });
                    }
                }
            }

            // Sort by updatedAt (newest first)
            tests.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

            res.json(tests);
        } catch (error: any) {
            logger.error('Error getting tests:', { error: error.message });
            res.status(500).json({ error: 'Failed to get tests' });
        }
    });

    // Get single test
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const testPath = getTestFilePath(TESTS_DIR, id);

            if (await fs.pathExists(testPath)) {
                const test = await fs.readJson(testPath);
                res.json(test);
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
            const testData = req.validatedData;
            const testId = req.body.id || uuidv4();

            const test = {
                ...testData,
                id: testId,
                updatedAt: new Date(),
                createdAt: req.body.createdAt || new Date()
            };

            await fs.writeJson(getTestFilePath(TESTS_DIR, testId), test);

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
            const testPath = getTestFilePath(TESTS_DIR, id);

            if (await fs.pathExists(testPath)) {
                const existingTest = await fs.readJson(testPath);
                const updatedTest = {
                    ...existingTest,
                    ...req.body,
                    id, // Preserve ID
                    updatedAt: new Date()
                };

                await fs.writeJson(testPath, updatedTest);

                webSocketService.broadcast({
                    type: 'test:updated',
                    test: updatedTest
                });

                res.json(updatedTest);
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
            const testPath = getTestFilePath(TESTS_DIR, id);

            if (await fs.pathExists(testPath)) {
                await fs.remove(testPath);

                webSocketService.broadcast({
                    type: 'test:deleted',
                    testId: id
                });

                res.json({ success: true, message: 'Test deleted successfully' });
            } else {
                res.status(404).json({ error: 'Test not found' });
            }
        } catch (error: any) {
            logger.error('Error deleting test:', { error: error.message, testId: req.params.id });
            res.status(500).json({ error: 'Failed to delete test' });
        }
    });

    return router;
}

export default createTestRoutes;
