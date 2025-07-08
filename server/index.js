const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const TestRunner = require('./testRunner');
const ScriptGenerator = require('./scriptGenerator');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Storage paths
const EXECUTIONS_DIR = path.join(__dirname, 'executions');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const VIDEOS_DIR = path.join(__dirname, 'videos');

// Ensure directories exist
fs.ensureDirSync(EXECUTIONS_DIR);
fs.ensureDirSync(SCREENSHOTS_DIR);
fs.ensureDirSync(VIDEOS_DIR);

// In-memory storage for active executions
const activeExecutions = new Map();

// WebSocket connections
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// API Routes

// Execute test workflow
app.post('/api/execute', async (req, res) => {
  try {
    const { workflowId, workflowName, steps, suite, tags, options = {} } = req.body;
    
    console.log('Received options:', options);
    console.log('Screenshot enabled:', options.enableScreenshots);
    console.log('Recording enabled:', options.enableRecording);
    console.log('Headless mode:', options.headlessMode);
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty steps provided' });
    }
    
    const executionId = uuidv4();
    const execution = {
      id: executionId,
      workflowId: workflowId || 'manual',
      workflowName: workflowName || 'Manual Test',
      status: 'queued',
      startTime: new Date(),
      suite: suite || 'Default',
      tags: tags || [],
      options: {
        enableScreenshots: options.enableScreenshots || false,
        enableRecording: options.enableRecording || false,
        headlessMode: options.headlessMode || false
      },
      steps: steps.map(step => {
        console.log('Processing step:', JSON.stringify(step, null, 2));
        
        const mappedStep = {
          stepId: step.id,
          type: step.type,
          status: 'pending',
          config: step.config
        };
        
        console.log('Mapped step:', JSON.stringify(mappedStep, null, 2));
        return mappedStep;
      }),
      screenshots: [],
      logs: [],
      progress: 0
    };
    
    activeExecutions.set(executionId, execution);
    
    // Save execution to file
    await fs.writeJson(path.join(EXECUTIONS_DIR, `${executionId}.json`), execution);
    
    // Start execution asynchronously
    executeTestWorkflow(executionId, execution);
    
    res.json({ executionId, status: 'queued' });
  } catch (error) {
    console.error('Error starting execution:', error);
    res.status(500).json({ error: 'Failed to start execution' });
  }
});

// Get execution status
app.get('/api/execution/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check active executions first
    if (activeExecutions.has(id)) {
      return res.json(activeExecutions.get(id));
    }
    
    // Check saved executions
    const executionPath = path.join(EXECUTIONS_DIR, `${id}.json`);
    if (await fs.pathExists(executionPath)) {
      const execution = await fs.readJson(executionPath);
      return res.json(execution);
    }
    
    res.status(404).json({ error: 'Execution not found' });
  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({ error: 'Failed to get execution' });
  }
});

// Get execution results
app.get('/api/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const executionPath = path.join(EXECUTIONS_DIR, `${id}.json`);
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
app.get('/api/executions', async (req, res) => {
  try {
    const files = await fs.readdir(EXECUTIONS_DIR);
    const executions = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const executionPath = path.join(EXECUTIONS_DIR, file);
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
app.delete('/api/execution/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (activeExecutions.has(id)) {
      const execution = activeExecutions.get(id);
      execution.status = 'cancelled';
      execution.endTime = new Date();
      
      // Save final state
      await fs.writeJson(path.join(EXECUTIONS_DIR, `${id}.json`), execution);
      
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
app.delete('/api/executions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove from active executions if exists
    if (activeExecutions.has(id)) {
      activeExecutions.delete(id);
    }
    
    // Delete execution file
    const executionPath = path.join(EXECUTIONS_DIR, `${id}.json`);
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

// Serve screenshots and videos
app.use('/screenshots', express.static(SCREENSHOTS_DIR));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Test execution function
async function executeTestWorkflow(executionId, execution) {
  try {
    execution.status = 'running';
    execution.startTime = new Date();
    
    // Broadcast start
    broadcast({
      type: 'execution:started',
      executionId,
      execution
    });
    
    // Generate Playwright script
    const scriptGenerator = new ScriptGenerator();
    const script = scriptGenerator.generateScript(execution.steps);
    
    // Execute with Playwright
    const testRunner = new TestRunner();
    
    // Initialize browser with options
    await testRunner.initializeBrowser({ 
      enableRecording: execution.options.enableRecording, 
      executionId: executionId,
      headless: execution.options.headlessMode
    });
    
    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];
      
      if (execution.status === 'cancelled') {
        break;
      }
      
      step.status = 'running';
      step.startTime = new Date();
      
      // Broadcast step start
      broadcast({
        type: 'step:started',
        executionId,
        stepIndex: i,
        step
      });
      
      try {
        // Execute step with options
        const result = await testRunner.executeStep(step, executionId, execution.options);
        
        step.status = result.success ? 'passed' : 'failed';
        step.endTime = new Date();
        step.duration = step.endTime - step.startTime;
        
        if (result.screenshot) {
          step.screenshot = result.screenshot;
          execution.screenshots.push(result.screenshot);
        }
        
        if (result.error) {
          step.error = result.error;
        }
        
        if (result.logs) {
          execution.logs.push(...result.logs);
        }
        
        // Update progress
        execution.progress = Math.round(((i + 1) / execution.steps.length) * 100);
        
        // Broadcast step completion
        broadcast({
          type: 'step:completed',
          executionId,
          stepIndex: i,
          step,
          progress: execution.progress
        });
        
        // If step failed and it's critical, stop execution
        if (!result.success && step.config.critical !== false) {
          execution.status = 'failed';
          execution.error = `Step ${i + 1} failed: ${result.error}`;
          break;
        }
        
      } catch (error) {
        step.status = 'failed';
        step.endTime = new Date();
        step.duration = step.endTime - step.startTime;
        step.error = error.message;
        
        execution.status = 'failed';
        execution.error = `Step ${i + 1} execution error: ${error.message}`;
        
        broadcast({
          type: 'step:failed',
          executionId,
          stepIndex: i,
          step,
          error: error.message
        });
        
        break;
      }
    }
    
    // Finalize execution
    if (execution.status === 'running') {
      execution.status = 'completed';
    }
    
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    
    // Calculate success rate
    const passedSteps = execution.steps.filter(s => s.status === 'passed').length;
    const totalSteps = execution.steps.length;
    execution.successRate = Math.round((passedSteps / totalSteps) * 100);
    
    // Save final execution state
    await fs.writeJson(path.join(EXECUTIONS_DIR, `${executionId}.json`), execution);
    
    // Close browser and save video
    await testRunner.closeBrowser();
    
    // Add video path if recording was enabled
    if (execution.options.enableRecording) {
      execution.videoPath = `/videos/${executionId}.webm`;
    }
    
    // Clean up from active executions
    activeExecutions.delete(executionId);
    
    // Broadcast completion
    broadcast({
      type: 'execution:completed',
      executionId,
      execution
    });
    
    console.log(`Execution ${executionId} completed with status: ${execution.status}`);
    
  } catch (error) {
    console.error(`Execution ${executionId} failed:`, error);
    
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    execution.error = error.message;
    
    // Save error state
    await fs.writeJson(path.join(EXECUTIONS_DIR, `${executionId}.json`), execution);
    
    activeExecutions.delete(executionId);
    
    // Broadcast failure
    broadcast({
      type: 'execution:failed',
      executionId,
      execution,
      error: error.message
    });
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeExecutions: activeExecutions.size,
    connectedClients: clients.size
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 TestFlow Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 