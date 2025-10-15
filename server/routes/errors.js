/**
 * Error reporting routes
 */

import express from 'express';
import errorHandler from '../services/errorHandler.js';
import { ERROR_CODES } from '../types/errors.js';

const router = express.Router();

/**
 * Report frontend error
 */
router.post('/', async (req, res) => {
  try {
    const { code, category, severity, message, details, errorId, context } = req.body;
    
    // Create error object
    const error = new Error(message);
    error.code = code;
    error.category = category;
    error.severity = severity;
    error.details = details;
    error.errorId = errorId;

    // Add request context
    const errorContext = {
      ...context,
      requestId: req.id,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id
    };

    // Log the error
    const loggedErrorId = await errorHandler.logError(error, errorContext);

    res.json({ 
      success: true, 
      errorId: loggedErrorId,
      message: 'Error reported successfully' 
    });
  } catch (error) {
    console.error('Error reporting failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to report error' 
    });
  }
});

/**
 * Get error statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = errorHandler.getErrorStats();
    res.json({ 
      success: true, 
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get error stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get error statistics' 
    });
  }
});

/**
 * Clear error statistics
 */
router.delete('/stats', async (req, res) => {
  try {
    errorHandler.clearErrorStats();
    res.json({ 
      success: true, 
      message: 'Error statistics cleared' 
    });
  } catch (error) {
    console.error('Failed to clear error stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear error statistics' 
    });
  }
});

/**
 * Get error logs (admin only)
 */
router.get('/logs', async (req, res) => {
  try {
    // TODO: Add authentication check
    // TODO: Add pagination and filtering
    
    const fs = await import('fs-extra');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const logsDir = path.join(__dirname, '..', 'logs');
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `errors-${today}.log`);
    
    if (await fs.pathExists(logFile)) {
      const logContent = await fs.readFile(logFile, 'utf8');
      const logs = logContent.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .reverse(); // Most recent first
      
      res.json({ 
        success: true, 
        logs,
        count: logs.length
      });
    } else {
      res.json({ 
        success: true, 
        logs: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Failed to get error logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get error logs' 
    });
  }
});

export default router;


