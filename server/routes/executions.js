/**
 * Execution routes
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { generateReadableExecutionId } = require('../utils/timestamp');
const { getExecutionFilePath } = require('../utils/fileUtils');
const { findStartStepIndex, buildStepMap, getNextStepId, calculateSuccessRate, hasFailedSteps } = require('../utils/executionUtils');
const { validateExecutionRequest } = require('../middleware/validation');
const errorHandler = require('../services/errorHandler');

const router = express.Router();

/**
 * Create execution service instance
 */
function createExecutionRoutes(activeExecutions, clients, broadcast, executeTestWorkflow, storageDirs) {
  const { EXECUTIONS_DIR, SCREENSHOTS_DIR, VIDEOS_DIR } = storageDirs;

  // Execute test workflow
  router.post('/execute', validateExecutionRequest, async (req, res) => {
    try {
      const { workflowId, workflowName, steps, suite, tags, options } = req.validatedData;
      
      // Generate execution ID and create execution object
      const baseTimestamp = new Date();
      const executionId = generateReadableExecutionId(workflowName, workflowId, baseTimestamp);
      
      const execution = {
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
        steps: steps.map(step => ({
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
    } catch (error) {
      await errorHandler.logError(error, { 
        executionId: req.body.workflowId, 
        endpoint: '/api/execute' 
      });
      res.status(500).json(errorHandler.formatApiError(error, { 
        requestId: req.id, 
        endpoint: '/api/execute' 
      }));
    }
  });

  // Get execution status
  router.get('/:id', async (req, res) => {
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
    } catch (error) {
      await errorHandler.logError(error, { 
        executionId: req.params.id, 
        endpoint: '/api/execution/:id' 
      });
      res.status(500).json(errorHandler.formatApiError(error, { 
        requestId: req.id, 
        endpoint: '/api/execution/:id' 
      }));
    }
  });

  // Get execution results
  router.get('/results/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const executionPath = getExecutionFilePath(EXECUTIONS_DIR, id);
      if (await fs.pathExists(executionPath)) {
        const execution = await fs.readJson(executionPath);
        res.json(execution);
      } else {
        res.status(404).json({ error: 'Results not found' });
      }
    } catch (error) {
      console.error('Error getting results:', error);
      res.status(500).json({ error: 'Failed to get results' });
    }
  });

  // Get all execution results
  router.get('/', async (req, res) => {
    try {
      const files = await fs.readdir(EXECUTIONS_DIR);
      const executions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const executionPath = getExecutionFilePath(EXECUTIONS_DIR, file.replace('.json', ''));
            const execution = await fs.readJson(executionPath);
            executions.push(execution);
          } catch (error) {
            console.error(`Error reading execution file ${file}:`, error);
          }
        }
      }
      
      // Sort by startTime (newest first)
      executions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      
      res.json(executions);
    } catch (error) {
      console.error('Error getting executions:', error);
      res.status(500).json({ error: 'Failed to get executions' });
    }
  });

  // Cancel execution
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (activeExecutions.has(id)) {
        const execution = activeExecutions.get(id);
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
      } else {
        res.status(404).json({ error: 'Execution not found or already completed' });
      }
    } catch (error) {
      console.error('Error cancelling execution:', error);
      res.status(500).json({ error: 'Failed to cancel execution' });
    }
  });

  // Delete execution record
  router.delete('/delete/:id', async (req, res) => {
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
        } catch (mediaError) {
          console.error('Error deleting media files:', mediaError);
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
    } catch (error) {
      console.error('Error deleting execution:', error);
      res.status(500).json({ error: 'Failed to delete execution' });
    }
  });

  return router;
}

module.exports = createExecutionRoutes;
