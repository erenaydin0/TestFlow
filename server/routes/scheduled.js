/**
 * Scheduled test routes
 */

import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

import { getScheduledTestFilePath } from '../utils/fileUtils.js';
import { validateScheduledTestRequest } from '../middleware/validation.js';
import errorHandler from '../services/errorHandler.js';
import logger from '../utils/logger.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Create scheduled test routes instance
 */
function createScheduledRoutes(storageDirs, broadcast, testScheduler) {
  const { SCHEDULED_TESTS_DIR } = storageDirs;

  // Get all scheduled tests
  router.get('/', async (req, res) => {
    try {
      const files = await fs.readdir(SCHEDULED_TESTS_DIR);
      const scheduledTests = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const schedulePath = getScheduledTestFilePath(SCHEDULED_TESTS_DIR, file.replace('.json', ''));
            const schedule = await fs.readJson(schedulePath);
            scheduledTests.push(schedule);
          } catch (error) {
            logger.error(`Error reading schedule file ${file}:`, { error: error.message });
          }
        }
      }

      // Sort by nextRun
      scheduledTests.sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun));

      // Calculate upcoming runs
      const upcomingRuns = scheduledTests
        .filter(s => s.enabled && s.status === 'active')
        .slice(0, 5)
        .map(s => ({
          id: uuidv4(),
          scheduledTestId: s.id,
          testName: s.name,
          scheduledTime: s.nextRun,
          estimatedDuration: s.lastDuration || 0,
          environment: s.environment
        }));

      res.json({ scheduledTests, upcomingRuns });
    } catch (error) {
      logger.error('Error getting scheduled tests:', { error: error.message });
      res.status(500).json({ error: 'Failed to get scheduled tests' });
    }
  });

  // Get single scheduled test
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const schedulePath = getScheduledTestFilePath(SCHEDULED_TESTS_DIR, id);

      if (await fs.pathExists(schedulePath)) {
        const schedule = await fs.readJson(schedulePath);
        res.json(schedule);
      } else {
        res.status(404).json({ error: 'Scheduled test not found' });
      }
    } catch (error) {
      logger.error('Error getting scheduled test:', { error: error.message, scheduleId: req.params.id });
      res.status(500).json({ error: 'Failed to get scheduled test' });
    }
  });

  // Create scheduled test
  router.post('/', validateScheduledTestRequest, async (req, res) => {
    try {
      const scheduleData = req.validatedData;
      const scheduleId = uuidv4();

      const schedule = {
        id: scheduleId,
        ...scheduleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
        status: 'active'
      };

      // Calculate next run time based on cron expression
      if (testScheduler) {
        schedule.nextRun = testScheduler.calculateNextRun(schedule.schedule);
      } else {
        // Fallback: 1 saat sonra
        schedule.nextRun = new Date(Date.now() + 60 * 60 * 1000);
      }

      await fs.writeJson(getScheduledTestFilePath(SCHEDULED_TESTS_DIR, scheduleId), schedule);

      // Scheduler'a ekle
      if (testScheduler) {
        testScheduler.scheduleTest(schedule);
      }

      broadcast({
        type: 'schedule:created',
        schedule
      });

      res.json(schedule);
    } catch (error) {
      logger.error('Error creating scheduled test:', { error: error.message });
      res.status(500).json({ error: 'Failed to create scheduled test' });
    }
  });

  // Update scheduled test
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const schedulePath = getScheduledTestFilePath(SCHEDULED_TESTS_DIR, id);

      if (await fs.pathExists(schedulePath)) {
        const existingSchedule = await fs.readJson(schedulePath);
        const updatedSchedule = {
          ...existingSchedule,
          ...req.body,
          id, // Preserve ID
          updatedAt: new Date()
        };

        // Eğer schedule değiştiyse nextRun'ı yeniden hesapla
        if (req.body.schedule && req.body.schedule !== existingSchedule.schedule) {
          if (testScheduler) {
            updatedSchedule.nextRun = testScheduler.calculateNextRun(updatedSchedule.schedule);
          }
        }

        await fs.writeJson(schedulePath, updatedSchedule);

        // Scheduler'ı güncelle
        if (testScheduler) {
          await testScheduler.reloadSchedule(id);
        }

        broadcast({
          type: 'schedule:updated',
          schedule: updatedSchedule
        });

        res.json(updatedSchedule);
      } else {
        res.status(404).json({ error: 'Scheduled test not found' });
      }
    } catch (error) {
      logger.error('Error updating scheduled test:', { error: error.message, scheduleId: req.params.id });
      res.status(500).json({ error: 'Failed to update scheduled test' });
    }
  });

  // Delete scheduled test
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const schedulePath = getScheduledTestFilePath(SCHEDULED_TESTS_DIR, id);

      if (await fs.pathExists(schedulePath)) {
        // Scheduler'dan kaldır
        if (testScheduler) {
          testScheduler.unscheduleTest(id);
        }

        await fs.remove(schedulePath);

        broadcast({
          type: 'schedule:deleted',
          scheduleId: id
        });

        res.json({ message: 'Scheduled test deleted successfully' });
      } else {
        res.status(404).json({ error: 'Scheduled test not found' });
      }
    } catch (error) {
      logger.error('Error deleting scheduled test:', { error: error.message, scheduleId: req.params.id });
      res.status(500).json({ error: 'Failed to delete scheduled test' });
    }
  });

  return router;
}

export default createScheduledRoutes;
