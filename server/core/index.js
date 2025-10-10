const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs-extra');
const path = require('path');

const config = require('./config');
const TestRunner = require('./testRunner');
const ScriptGenerator = require('./scriptGenerator');
const TestScheduler = require('./scheduler');
const errorHandler = require('../services/errorHandler');
const healthChecker = require('../services/healthChecker');

// Utils
const { ensureDirectoriesExist } = require('../utils/fileUtils');
const { generateScheduledExecutionId } = require('../utils/timestamp');
const { findStartStepIndex, buildStepMap, getNextStepId, calculateSuccessRate, hasFailedSteps } = require('../utils/executionUtils');

// Routes
const createExecutionRoutes = require('../routes/executions');
const createTestRoutes = require('../routes/tests');
const createScheduledRoutes = require('../routes/scheduled');
const createHealthRoutes = require('../routes/health');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Storage paths
const storageDirs = {
  EXECUTIONS_DIR: path.join(__dirname, '../storage/executions'),
  SCREENSHOTS_DIR: path.join(__dirname, '../storage/screenshots'),
  VIDEOS_DIR: path.join(__dirname, '../storage/videos'),
  SCHEDULED_TESTS_DIR: path.join(__dirname, '../storage/scheduled-tests'),
  TESTS_DIR: path.join(__dirname, '../storage/tests')
};

// Ensure directories exist
ensureDirectoriesExist(storageDirs);

// In-memory storage for active executions
const activeExecutions = new Map();

// WebSocket connections
const clients = new Set();

// Test Scheduler instance
let testScheduler = null;

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

// Execute scheduled test function
async function executeScheduledTest(schedule) {
  console.log(`🚀 Zamanlanmış test başlatılıyor: ${schedule.name}`);
  
  try {
    // Test workflow'unu backend'den yükle
    const testPath = path.join(storageDirs.TESTS_DIR, `${schedule.testId}.json`);
    
    if (!await fs.pathExists(testPath)) {
      console.error(`❌ Test bulunamadı: ${schedule.testId}`);
      return null;
    }
    
    const testWorkflow = await fs.readJson(testPath);
    
    if (!testWorkflow || !testWorkflow.workflow || testWorkflow.workflow.length === 0) {
      console.error(`❌ Test workflow boş: ${schedule.testId}`);
      return null;
    }
    
    // Tek timestamp oluştur ve hem ID hem startTime için kullan
    const baseTimestamp = new Date();
    const executionId = generateScheduledExecutionId(schedule.testId, baseTimestamp);
    
    // Execution objesi oluştur
    const execution = {
      id: executionId,
      workflowId: schedule.testId,
      workflowName: schedule.name,
      status: 'queued',
      startTime: baseTimestamp,
      suite: schedule.suite,
      tags: ['scheduled'],
      options: {
        enableScreenshots: false,
        enableRecording: false,
        headlessMode: process.env.HEADLESS_MODE === 'true' || true,
        browserType: process.env.DEFAULT_BROWSER || 'chromium'
      },
      steps: testWorkflow.workflow.map(step => ({
        stepId: step.id,
        type: step.type,
        status: 'pending',
        config: step
      })),
      screenshots: [],
      logs: [],
      progress: 0,
      scheduledTestId: schedule.id
    };
    
    activeExecutions.set(executionId, execution);
    
    // Execution'ı kaydet
    await fs.writeJson(path.join(storageDirs.EXECUTIONS_DIR, `${executionId}.json`), execution);
    
    // Broadcast başlangıç
    broadcast({
      type: 'execution:scheduled',
      executionId,
      execution,
      scheduleName: schedule.name
    });
    
    console.log(`✅ Zamanlanmış test başlatıldı: ${executionId} (${execution.steps.length} adım)`);
    
    // Test'i asenkron olarak çalıştır (blocking olmadan)
    setImmediate(() => {
      executeTestWorkflow(executionId, execution).catch(error => {
        console.error(`❌ Zamanlanmış test çalıştırma hatası (${executionId}):`, error);
      });
    });
    
    return executionId;
  } catch (error) {
    console.error('Zamanlanmış test çalıştırma hatası:', error);
    throw error;
  }
}

// Test execution function
async function executeTestWorkflow(executionId, execution) {
  try {
    execution.status = 'running';
    
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
      headless: execution.options.headlessMode,
      browserType: execution.options.browserType || 'chromium'
    });
    
    // Build step map for conditional navigation
    const stepMap = buildStepMap(execution.steps);
    
    // Find start step
    const startIndex = findStartStepIndex(execution.steps);
    
    console.log(`Starting execution from step ${startIndex}: ${execution.steps[startIndex].stepId}`);
    
    // Track visited steps to prevent infinite loops
    const visitedSteps = new Set();
    const maxIterations = execution.steps.length * 10; // Safety limit
    let iterations = 0;
    
    let currentStepId = execution.steps[startIndex].stepId;
    
    while (currentStepId && iterations < maxIterations) {
      iterations++;
      
      // Get current step index
      const i = stepMap.get(currentStepId);
      if (i === undefined) {
        console.error(`Step not found: ${currentStepId}`);
        break;
      }
      
      // Check for infinite loop
      if (visitedSteps.has(currentStepId) && iterations > execution.steps.length) {
        console.warn(`Possible infinite loop detected at step ${currentStepId}`);
        break;
      }
      visitedSteps.add(currentStepId);
      
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
        
        // IF adımları için koşul sonucunu kaydet
        if (step.type === 'if' && result.conditionResult !== undefined) {
          step.conditionResult = result.conditionResult;
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
        
        // Determine next step
        const nextStepId = getNextStepId(step, result.conditionResult);
        
        if (nextStepId) {
          console.log(`Following connection to step ${nextStepId}`);
        } else {
          console.log(`No more steps to execute, ending workflow`);
        }
        
        // If step failed and it's critical, stop execution
        if (!result.success && step.config.critical !== false) {
          execution.status = 'failed';
          execution.error = errorHandler.createSafeErrorMessage(
            new Error(result.error), 
            { stepIndex: i, stepId: step.stepId }
          );
          break;
        }
        
        // Set next step or end execution
        if (nextStepId && stepMap.has(nextStepId)) {
          currentStepId = nextStepId;
        } else {
          console.log('No more steps to execute, ending workflow');
          currentStepId = null;
        }
        
      } catch (error) {
        step.status = 'failed';
        step.endTime = new Date();
        step.duration = step.endTime - step.startTime;
        step.error = errorHandler.createSafeErrorMessage(error, { stepIndex: i });
        
        execution.status = 'failed';
        execution.error = errorHandler.createSafeErrorMessage(error, { stepIndex: i });
        
        // Log detaylı hata
        await errorHandler.logError(error, { 
          executionId, 
          stepIndex: i, 
          stepId: step.stepId 
        });
        
        broadcast({
          type: 'step:failed',
          executionId,
          stepIndex: i,
          step,
          error: errorHandler.createSafeErrorMessage(error, { stepIndex: i })
        });
        
        break;
      }
    }
    
    // Finalize execution - check if any steps failed
    if (execution.status === 'running') {
      execution.status = hasFailedSteps(execution.steps) ? 'failed' : 'completed';
    }
    
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    
    // Calculate success rate
    execution.successRate = calculateSuccessRate(execution.steps);
    
    // Close browser and save video
    const originalVideoPath = await testRunner.closeBrowser();
    
    // Add video path if recording was enabled
    if (execution.options.enableRecording && originalVideoPath) {
      try {
        // Rename video file to match executionId
        const newVideoPath = path.join(storageDirs.VIDEOS_DIR, `${executionId}.webm`);
        
        // Check if original video file exists
        if (await fs.pathExists(originalVideoPath)) {
          // Move/rename the file
          await fs.move(originalVideoPath, newVideoPath, { overwrite: true });
          execution.videoPath = `/videos/${executionId}.webm`;
          console.log(`Video renamed from ${originalVideoPath} to ${newVideoPath}`);
        } else {
          console.log(`Original video file not found: ${originalVideoPath}`);
        }
      } catch (error) {
        console.error('Error renaming video file:', error);
      }
    }
    
    // Save final execution state with video path
    await fs.writeJson(path.join(storageDirs.EXECUTIONS_DIR, `${executionId}.json`), execution);
    
    // Clean up from active executions
    activeExecutions.delete(executionId);
    
    // Broadcast completion or failure based on status
    broadcast({
      type: execution.status === 'failed' ? 'execution:failed' : 'execution:completed',
      executionId,
      execution,
      error: execution.error
    });
    
    console.log(`Execution ${executionId} completed with status: ${execution.status}`);
    
  } catch (error) {
    console.error(`Execution ${executionId} failed:`, error);
    
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    execution.error = errorHandler.createSafeErrorMessage(error, { executionId });
    
    // Log detaylı hata
    await errorHandler.logError(error, { executionId });
    
    // Save error state
    await fs.writeJson(path.join(storageDirs.EXECUTIONS_DIR, `${executionId}.json`), execution);
    
    activeExecutions.delete(executionId);
    
    // Broadcast failure
    broadcast({
      type: 'execution:failed',
      executionId,
      execution,
      error: errorHandler.createSafeErrorMessage(error, { executionId })
    });
  }
}

// Setup routes
app.use('/api/executions', createExecutionRoutes(activeExecutions, clients, broadcast, executeTestWorkflow, storageDirs));
app.use('/api/tests', createTestRoutes(storageDirs, broadcast));
app.use('/api/scheduled-tests', createScheduledRoutes(storageDirs, broadcast, testScheduler));
app.use('/api/health', createHealthRoutes(activeExecutions, clients, testScheduler, healthChecker));

// Serve screenshots and videos
app.use('/screenshots', express.static(storageDirs.SCREENSHOTS_DIR));
app.use('/videos', express.static(storageDirs.VIDEOS_DIR));

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 CosmicQA Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready for connections`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  
  // Initialize Test Scheduler
  testScheduler = new TestScheduler(executeScheduledTest, storageDirs.SCHEDULED_TESTS_DIR);
  await testScheduler.initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  
  // Stop all scheduled tasks
  if (testScheduler) {
    testScheduler.stopAll();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  
  // Stop all scheduled tasks
  if (testScheduler) {
    testScheduler.stopAll();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
