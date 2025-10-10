/**
 * Test routes
 */

const express = require('express');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { getTestFilePath } = require('../utils/fileUtils');
const { validateTestRequest } = require('../middleware/validation');
const errorHandler = require('../services/errorHandler');

const router = express.Router();

/**
 * Create test routes instance
 */
function createTestRoutes(storageDirs, broadcast) {
  const { TESTS_DIR } = storageDirs;

  // Get all tests
  router.get('/', async (req, res) => {
    try {
      const files = await fs.readdir(TESTS_DIR);
      const tests = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const testPath = getTestFilePath(TESTS_DIR, file.replace('.json', ''));
            const test = await fs.readJson(testPath);
            tests.push(test);
          } catch (error) {
            console.error(`Error reading test file ${file}:`, error);
          }
        }
      }
      
      // Sort by updatedAt (newest first)
      tests.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      
      res.json(tests);
    } catch (error) {
      console.error('Error getting tests:', error);
      res.status(500).json({ error: 'Failed to get tests' });
    }
  });

  // Get single test
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const testPath = getTestFilePath(TESTS_DIR, id);
      
      if (await fs.pathExists(testPath)) {
        const test = await fs.readJson(testPath);
        res.json(test);
      } else {
        res.status(404).json({ error: 'Test not found' });
      }
    } catch (error) {
      console.error('Error getting test:', error);
      res.status(500).json({ error: 'Failed to get test' });
    }
  });

  // Create or update test
  router.post('/', validateTestRequest, async (req, res) => {
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
      
      broadcast({
        type: 'test:saved',
        test
      });
      
      res.json(test);
    } catch (error) {
      console.error('Error saving test:', error);
      res.status(500).json({ error: 'Failed to save test' });
    }
  });

  // Update test
  router.put('/:id', async (req, res) => {
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
        
        broadcast({
          type: 'test:updated',
          test: updatedTest
        });
        
        res.json(updatedTest);
      } else {
        res.status(404).json({ error: 'Test not found' });
      }
    } catch (error) {
      console.error('Error updating test:', error);
      res.status(500).json({ error: 'Failed to update test' });
    }
  });

  // Delete test
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const testPath = getTestFilePath(TESTS_DIR, id);
      
      if (await fs.pathExists(testPath)) {
        await fs.remove(testPath);
        
        broadcast({
          type: 'test:deleted',
          testId: id
        });
        
        res.json({ success: true, message: 'Test deleted successfully' });
      } else {
        res.status(404).json({ error: 'Test not found' });
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      res.status(500).json({ error: 'Failed to delete test' });
    }
  });

  return router;
}

module.exports = createTestRoutes;
