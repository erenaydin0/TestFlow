/**
 * Health check routes
 */

const express = require('express');
const errorHandler = require('../services/errorHandler');

const router = express.Router();

/**
 * Create health routes instance
 */
function createHealthRoutes(activeExecutions, clients, testScheduler, healthChecker) {
  // Health check endpoints
  router.get('/', async (req, res) => {
    try {
      const health = await healthChecker.generateHealthReport(
        activeExecutions, 
        clients, 
        testScheduler
      );
      
      const statusCode = health.status === 'error' ? 503 : 200;
      res.status(statusCode).json(health);
    } catch (error) {
      await errorHandler.logError(error, { endpoint: '/api/health' });
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: errorHandler.createSafeErrorMessage(error)
      });
    }
  });

  // Quick health check (lightweight)
  router.get('/quick', (req, res) => {
    try {
      const health = healthChecker.getQuickHealth(activeExecutions, clients, testScheduler);
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Quick health check failed'
      });
    }
  });

  // Detailed system metrics
  router.get('/metrics', async (req, res) => {
    try {
      const metrics = healthChecker.getSystemMetrics();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        metrics
      });
    } catch (error) {
      await errorHandler.logError(error, { endpoint: '/api/health/metrics' });
      res.status(500).json(errorHandler.formatApiError(error, { 
        endpoint: '/api/health/metrics' 
      }));
    }
  });

  return router;
}

module.exports = createHealthRoutes;
