const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const TestRunner = require('./testRunner');
const ScriptGenerator = require('./scriptGenerator');
const TestScheduler = require('./scheduler');

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
const SCHEDULED_TESTS_DIR = path.join(__dirname, 'scheduled-tests');
const TESTS_DIR = path.join(__dirname, 'tests');

// Ensure directories exist
fs.ensureDirSync(EXECUTIONS_DIR);
fs.ensureDirSync(SCREENSHOTS_DIR);
fs.ensureDirSync(VIDEOS_DIR);
fs.ensureDirSync(SCHEDULED_TESTS_DIR);
fs.ensureDirSync(TESTS_DIR);

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
    const testPath = path.join(TESTS_DIR, `${schedule.testId}.json`);
    
    if (!await fs.pathExists(testPath)) {
      console.error(`❌ Test bulunamadı: ${schedule.testId}`);
      return null;
    }
    
    const testWorkflow = await fs.readJson(testPath);
    
    if (!testWorkflow || !testWorkflow.workflow || testWorkflow.workflow.length === 0) {
      console.error(`❌ Test workflow boş: ${schedule.testId}`);
      return null;
    }
    
    // Execution ID oluştur
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    const executionId = `scheduled-${schedule.testId.slice(0, 8)}-${timestamp}`;
    
    // Execution objesi oluştur
    const execution = {
      id: executionId,
      workflowId: schedule.testId,
      workflowName: schedule.name,
      status: 'queued',
      startTime: new Date(),
      suite: schedule.suite,
      tags: ['scheduled'],
      options: {
        enableScreenshots: false,
        enableRecording: false,
        headlessMode: true,
        browserType: 'chromium'
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
    await fs.writeJson(path.join(EXECUTIONS_DIR, `${executionId}.json`), execution);
    
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

// API Routes

// Execute test workflow
app.post('/api/execute', async (req, res) => {
  try {
    const { workflowId, workflowName, steps, suite, tags, options = {} } = req.body;
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty steps provided' });
    }
    
    // Generate readable execution ID based on workflow name
    const generateReadableExecutionId = (workflowName, workflowId) => {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
      if (workflowId && workflowId !== 'manual' && !workflowId.includes('-') === false) {
        // Use existing readable ID + timestamp
        return `${workflowId}-${timestamp}`;
      }
      // Fallback to name-based ID
      const cleanName = workflowName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20) || 'test';
      return `${cleanName}-${timestamp}`;
    };

    const executionId = generateReadableExecutionId(workflowName, workflowId);
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
        headlessMode: options.headlessMode || false,
        browserType: options.browserType || 'chromium'
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
      headless: execution.options.headlessMode,
      browserType: execution.options.browserType || 'chromium'
    });
    
    // Build step map for conditional navigation
    const stepMap = new Map();
    execution.steps.forEach((step, index) => {
      stepMap.set(step.stepId, index);
    });
    
    // Find start step (step with no incoming connections)
    const hasIncomingConnection = new Set();
    execution.steps.forEach(step => {
      // Check normal connections
      if (step.config.connections) {
        step.config.connections.forEach(targetId => hasIncomingConnection.add(targetId));
      }
      // Check IF connections
      if (step.config.trueConnection) {
        hasIncomingConnection.add(step.config.trueConnection);
      }
      if (step.config.falseConnection) {
        hasIncomingConnection.add(step.config.falseConnection);
      }
    });
    
    // Find start step index
    let startIndex = 0;
    for (let idx = 0; idx < execution.steps.length; idx++) {
      if (!hasIncomingConnection.has(execution.steps[idx].stepId)) {
        startIndex = idx;
        break;
      }
    }
    
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
        
        // Determine next step based on step type and connections
        let nextStepId = null;
        
        // Handle IF step conditional navigation
        if (step.type === 'if' && result.conditionResult !== undefined) {
          nextStepId = result.conditionResult 
            ? step.config.trueConnection 
            : step.config.falseConnection;
          
          if (nextStepId) {
            console.log(`IF condition ${result.conditionResult ? 'TRUE' : 'FALSE'}: next step ${nextStepId}`);
          } else {
            console.log(`IF step has no ${result.conditionResult ? 'TRUE' : 'FALSE'} connection, ending execution`);
          }
        }
        // Handle normal connections (non-IF steps)
        else if (step.type !== 'if' && step.config.connections && step.config.connections.length > 0) {
          nextStepId = step.config.connections[0]; // Take first connection
          if (nextStepId) {
            console.log(`Following connection to step ${nextStepId}`);
          }
        }
        
        // If step failed and it's critical, stop execution
        if (!result.success && step.config.critical !== false) {
          execution.status = 'failed';
          execution.error = `Step ${i + 1} failed: ${result.error}`;
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
    
    // Finalize execution - check if any steps failed
    if (execution.status === 'running') {
      const hasFailedSteps = execution.steps.some(step => step.status === 'failed');
      execution.status = hasFailedSteps ? 'failed' : 'completed';
    }
    
    execution.endTime = new Date();
    execution.duration = execution.endTime - execution.startTime;
    
    // Calculate success rate
    const passedSteps = execution.steps.filter(s => s.status === 'passed').length;
    const totalSteps = execution.steps.length;
    execution.successRate = Math.round((passedSteps / totalSteps) * 100);
    
    // Close browser and save video
    const originalVideoPath = await testRunner.closeBrowser();
    
    // Add video path if recording was enabled
    if (execution.options.enableRecording && originalVideoPath) {
      try {
        // Rename video file to match executionId
        const newVideoPath = path.join(VIDEOS_DIR, `${executionId}.webm`);
        
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
    await fs.writeJson(path.join(EXECUTIONS_DIR, `${executionId}.json`), execution);
    
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

// Scheduled Tests API

// Get all scheduled tests
app.get('/api/scheduled-tests', async (req, res) => {
  try {
    const files = await fs.readdir(SCHEDULED_TESTS_DIR);
    const scheduledTests = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const schedulePath = path.join(SCHEDULED_TESTS_DIR, file);
          const schedule = await fs.readJson(schedulePath);
          scheduledTests.push(schedule);
        } catch (error) {
          console.error(`Error reading schedule file ${file}:`, error);
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
    console.error('Error getting scheduled tests:', error);
    res.status(500).json({ error: 'Failed to get scheduled tests' });
  }
});

// Get single scheduled test
app.get('/api/scheduled-tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedulePath = path.join(SCHEDULED_TESTS_DIR, `${id}.json`);
    
    if (await fs.pathExists(schedulePath)) {
      const schedule = await fs.readJson(schedulePath);
      res.json(schedule);
    } else {
      res.status(404).json({ error: 'Scheduled test not found' });
    }
  } catch (error) {
    console.error('Error getting scheduled test:', error);
    res.status(500).json({ error: 'Failed to get scheduled test' });
  }
});

// Create scheduled test
app.post('/api/scheduled-tests', async (req, res) => {
  try {
    const scheduleData = req.body;
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
      schedule.nextRun = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    await fs.writeJson(path.join(SCHEDULED_TESTS_DIR, `${scheduleId}.json`), schedule);
    
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
    console.error('Error creating scheduled test:', error);
    res.status(500).json({ error: 'Failed to create scheduled test' });
  }
});

// Update scheduled test
app.put('/api/scheduled-tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedulePath = path.join(SCHEDULED_TESTS_DIR, `${id}.json`);
    
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
    console.error('Error updating scheduled test:', error);
    res.status(500).json({ error: 'Failed to update scheduled test' });
  }
});

// Get all tests
app.get('/api/tests', async (req, res) => {
  try {
    const files = await fs.readdir(TESTS_DIR);
    const tests = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const testPath = path.join(TESTS_DIR, file);
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
app.get('/api/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testPath = path.join(TESTS_DIR, `${id}.json`);
    
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
app.post('/api/tests', async (req, res) => {
  try {
    const testData = req.body;
    const testId = testData.id || uuidv4();
    
    const test = {
      ...testData,
      id: testId,
      updatedAt: new Date(),
      createdAt: testData.createdAt || new Date()
    };
    
    await fs.writeJson(path.join(TESTS_DIR, `${testId}.json`), test);
    
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
app.put('/api/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testPath = path.join(TESTS_DIR, `${id}.json`);
    
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
app.delete('/api/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testPath = path.join(TESTS_DIR, `${id}.json`);
    
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

// Delete scheduled test
app.delete('/api/scheduled-tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedulePath = path.join(SCHEDULED_TESTS_DIR, `${id}.json`);
    
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
    console.error('Error deleting scheduled test:', error);
    res.status(500).json({ error: 'Failed to delete scheduled test' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeExecutions: activeExecutions.size,
    connectedClients: clients.size,
    activeSchedules: testScheduler ? testScheduler.getScheduleCount() : 0
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 CosmicQA Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready for connections`);
  
  // Initialize Test Scheduler
  testScheduler = new TestScheduler(executeScheduledTest, SCHEDULED_TESTS_DIR);
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