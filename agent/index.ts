/**
 * CosmicQA Local Test Runner Agent
 * 
 * Bu agent yerel bilgisayarınızda çalışarak Supabase'den
 * sıradaki testleri alır ve Playwright ile çalıştırır.
 * 
 * Özellikler:
 *   - Manuel tetiklenen testleri çalıştırır
 *   - Zamanlanmış (scheduled) testleri otomatik çalıştırır
 *   - Supabase Realtime ile anlık bildirim alır
 * 
 * Kullanım:
 *   npx tsx agent/index.ts
 * 
 * Environment variables (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase proje URL'i
 *   SUPABASE_SERVICE_KEY - Supabase service role key
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Scheduled test check interval (1 minute)
const SCHEDULED_CHECK_INTERVAL = 60 * 1000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Types
// ============================================================================

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  suite?: string;
  tags: string;
  options: string;
  steps: string;
  screenshots: string;
  logs: string;
  progress: number;
  videoPath?: string;
  error?: string;
  successRate?: number;
  scheduledTestId?: string;
  workspaceId?: string;
}

interface Step {
  stepId: string;
  type: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  config: any;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  screenshot?: string;
}

interface ExecutionOptions {
  enableScreenshots: boolean;
  enableRecording: boolean;
  headlessMode: boolean;
  browserType: string;
}

interface ScheduledTest {
  id: string;
  testId: string;
  name: string;
  description: string;
  schedule: string;
  frequency: string;
  status: string;
  lastRun?: string;
  nextRun?: string;
  lastDuration?: number;
  successRate?: number;
  suite: string;
  environment: string;
  enabled: boolean;
  workspaceId?: string;
}

interface Test {
  id: string;
  name: string;
  workflow: string;
  browserType: string;
  headlessMode: boolean;
  enableScreenshots: boolean;
  enableRecording: boolean;
}

// ============================================================================
// Test Runner
// ============================================================================

class LocalTestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isRunning = false;

  async initializeBrowser(options: ExecutionOptions): Promise<void> {
    const { headlessMode, browserType } = options;

    // Always force headless mode
    const effectiveHeadlessMode = true;

    console.log(`🌐 Launching ${browserType} browser (headless: ${effectiveHeadlessMode})...`);

    let browserEngine;
    switch (browserType) {
      case 'firefox':
        browserEngine = firefox;
        break;
      case 'webkit':
        browserEngine = webkit;
        break;
      default:
        browserEngine = chromium;
    }

    this.browser = await browserEngine.launch({
      headless: effectiveHeadlessMode,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    if (!this.browser) {
      throw new Error(`Failed to launch ${browserType} browser`);
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    if (!this.context) {
      throw new Error('Failed to create browser context');
    }

    this.page = await this.context.newPage();
    console.log('✅ Browser initialized');
  }

  async closeBrowser(): Promise<void> {
    if (this.page) await this.page.close().catch(() => { });
    if (this.context) await this.context.close().catch(() => { });
    if (this.browser) await this.browser.close().catch(() => { });

    this.page = null;
    this.context = null;
    this.browser = null;
    console.log('🔒 Browser closed');
  }

  async executeStep(step: Step): Promise<{ success: boolean; error?: string }> {
    if (!this.page) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const { type, config } = step;

      switch (type) {
        case 'navigate':
          await this.page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          break;

        case 'click':
          await this.page.click(config.selector, { timeout: 10000 });
          break;

        case 'type':
        case 'fill':
          await this.page.fill(config.selector, config.value || config.text, { timeout: 10000 });
          break;

        case 'wait':
          if (config.selector) {
            await this.page.waitForSelector(config.selector, { timeout: config.timeout || 10000 });
          } else {
            await this.page.waitForTimeout(config.duration || config.timeout || 1000);
          }
          break;

        case 'screenshot':
          // Screenshots handled separately
          break;

        case 'assert':
          if (config.type === 'visible') {
            await this.page.waitForSelector(config.selector, { state: 'visible', timeout: 10000 });
          } else if (config.type === 'text') {
            const text = await this.page.textContent(config.selector);
            if (!text?.includes(config.expectedValue)) {
              throw new Error(`Text assertion failed: expected "${config.expectedValue}", got "${text}"`);
            }
          }
          break;

        case 'select':
          await this.page.selectOption(config.selector, config.value);
          break;

        case 'hover':
          await this.page.hover(config.selector);
          break;

        case 'press':
          await this.page.keyboard.press(config.key);
          break;

        case 'scroll':
          if (config.selector) {
            await this.page.locator(config.selector).scrollIntoViewIfNeeded();
          } else {
            await this.page.evaluate((y) => window.scrollBy(0, y), config.y || 500);
          }
          break;

        default:
          console.warn(`⚠️ Unknown step type: ${type}`);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async takeScreenshot(executionId: string, stepIndex: number): Promise<string | null> {
    if (!this.page) return null;

    try {
      const screenshotDir = path.join(process.cwd(), 'agent', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const filename = `${executionId}_step${stepIndex}.png`;
      const filepath = path.join(screenshotDir, filename);

      await this.page.screenshot({ path: filepath, fullPage: false });

      // Upload to Supabase Storage
      const buffer = fs.readFileSync(filepath);
      const { error } = await supabase.storage
        .from('screenshots')
        .upload(`${executionId}/${filename}`, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('Screenshot upload error:', error);
        return null;
      }

      return filename;
    } catch (error) {
      console.error('Screenshot error:', error);
      return null;
    }
  }

  async runExecution(execution: Execution): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Already running an execution, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting execution: ${execution.id}`);
    console.log(`   Workflow: ${execution.workflowName}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const options: ExecutionOptions = JSON.parse(execution.options || '{}');
      const steps: Step[] = JSON.parse(execution.steps || '[]');

      // Update status to running
      await supabase.from('Execution').update({
        status: 'running',
        updatedAt: new Date().toISOString()
      }).eq('id', execution.id);

      // Initialize browser
      await this.initializeBrowser(options);

      const screenshots: string[] = [];
      const logs: string[] = [];
      let hasFailure = false;

      // Execute steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`📍 Step ${i + 1}/${steps.length}: ${step.type}`);

        step.status = 'running';
        step.startTime = new Date();

        // Update progress
        const progress = Math.round(((i + 1) / steps.length) * 100);
        await supabase.from('Execution').update({
          steps: JSON.stringify(steps),
          progress,
          updatedAt: new Date().toISOString()
        }).eq('id', execution.id);

        // Execute step
        const result = await this.executeStep(step);

        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
        step.status = result.success ? 'passed' : 'failed';

        if (!result.success) {
          step.error = result.error;
          hasFailure = true;
          console.log(`   ❌ Failed: ${result.error}`);
          logs.push(`Step ${i + 1} failed: ${result.error}`);

          // ALWAYS take screenshot on failure (regardless of enableScreenshots setting)
          console.log('📸 Taking failure screenshot...');
          const screenshot = await this.takeScreenshot(execution.id, i);
          if (screenshot) {
            step.screenshot = screenshot;
            screenshots.push(screenshot);
            console.log(`   📸 Screenshot saved: ${screenshot}`);
          } else {
            console.log('   ⚠️ Failed to take screenshot');
          }

          break; // Stop on failure
        } else {
          console.log(`   ✅ Passed (${step.duration}ms)`);
          logs.push(`Step ${i + 1} passed in ${step.duration}ms`);

          // Take screenshot if enabled
          if (options.enableScreenshots) {
            const screenshot = await this.takeScreenshot(execution.id, i);
            if (screenshot) {
              step.screenshot = screenshot;
              screenshots.push(screenshot);
            }
          }
        }
      }

      // Finalize
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const passedSteps = steps.filter(s => s.status === 'passed').length;
      const successRate = (passedSteps / steps.length) * 100;

      await supabase.from('Execution').update({
        status: hasFailure ? 'failed' : 'completed',
        endTime: endTime.toISOString(),
        duration,
        steps: JSON.stringify(steps),
        screenshots: JSON.stringify(screenshots),
        logs: JSON.stringify(logs),
        progress: 100,
        successRate,
        error: hasFailure ? steps.find(s => s.error)?.error : null,
        updatedAt: new Date().toISOString()
      }).eq('id', execution.id);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`${hasFailure ? '❌' : '✅'} Execution ${hasFailure ? 'FAILED' : 'COMPLETED'}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
      console.log(`${'='.repeat(60)}\n`);

    } catch (error: any) {
      console.error('❌ Execution error:', error);

      await supabase.from('Execution').update({
        status: 'failed',
        endTime: new Date().toISOString(),
        error: error.message,
        updatedAt: new Date().toISOString()
      }).eq('id', execution.id);

    } finally {
      await this.closeBrowser();
      this.isRunning = false;
    }
  }

  async runScheduledTest(scheduledTest: ScheduledTest, test: Test): Promise<boolean> {
    const startTime = new Date();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📅 Running scheduled test: ${scheduledTest.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const workflow = JSON.parse(test.workflow || '[]');
      const steps: Step[] = workflow.map((step: any) => ({
        stepId: step.id,
        type: step.type,
        status: 'pending' as const,
        config: step.config || step
      }));

      // Create execution record
      const executionId = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      await supabase.from('Execution').insert({
        id: executionId,
        workflowId: test.id,
        workflowName: scheduledTest.name,
        status: 'running',
        startTime: startTime.toISOString(),
        suite: scheduledTest.suite,
        tags: JSON.stringify(['scheduled', scheduledTest.frequency]),
        options: JSON.stringify({
          enableScreenshots: test.enableScreenshots,
          enableRecording: false,
          headlessMode: true,
          browserType: test.browserType || 'chromium'
        }),
        steps: JSON.stringify(steps),
        screenshots: '[]',
        logs: '[]',
        progress: 0,
        scheduledTestId: scheduledTest.id,
        workspaceId: scheduledTest.workspaceId
      });

      // Initialize browser
      await this.initializeBrowser({
        enableScreenshots: test.enableScreenshots,
        enableRecording: false,
        headlessMode: true,
        browserType: test.browserType || 'chromium'
      });

      let hasFailure = false;
      const screenshots: string[] = [];
      const logs: string[] = [];

      // Execute steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`📍 Step ${i + 1}/${steps.length}: ${step.type}`);

        step.status = 'running';
        step.startTime = new Date();

        const result = await this.executeStep(step);

        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
        step.status = result.success ? 'passed' : 'failed';

        if (!result.success) {
          step.error = result.error;
          hasFailure = true;
          console.log(`   ❌ Failed: ${result.error}`);
          logs.push(`Step ${i + 1} failed: ${result.error}`);

          // Take screenshot on failure
          if (test.enableScreenshots) {
            const screenshot = await this.takeScreenshot(executionId, i);
            if (screenshot) {
              step.screenshot = screenshot;
              screenshots.push(screenshot);
            }
          }
          break;
        } else {
          console.log(`   ✅ Passed (${step.duration}ms)`);
          logs.push(`Step ${i + 1} passed in ${step.duration}ms`);
        }

        // Update progress
        await supabase.from('Execution').update({
          steps: JSON.stringify(steps),
          progress: Math.round(((i + 1) / steps.length) * 100)
        }).eq('id', executionId);
      }

      // Finalize execution
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const passedSteps = steps.filter(s => s.status === 'passed').length;
      const successRate = (passedSteps / steps.length) * 100;

      await supabase.from('Execution').update({
        status: hasFailure ? 'failed' : 'completed',
        endTime: endTime.toISOString(),
        duration,
        steps: JSON.stringify(steps),
        screenshots: JSON.stringify(screenshots),
        logs: JSON.stringify(logs),
        progress: 100,
        successRate,
        error: hasFailure ? steps.find(s => s.error)?.error : null
      }).eq('id', executionId);

      // Update scheduled test lastRun, nextRun
      const nextRun = this.calculateNextRun(scheduledTest.frequency);
      await supabase.from('ScheduledTest').update({
        lastRun: startTime.toISOString(),
        nextRun: nextRun.toISOString(),
        lastDuration: duration,
        successRate: successRate,
        status: hasFailure ? 'failed' : 'active'
      }).eq('id', scheduledTest.id);

      console.log(`\n${hasFailure ? '❌' : '✅'} Scheduled test ${hasFailure ? 'FAILED' : 'PASSED'} (${duration}ms)`);
      console.log(`📅 Next run: ${nextRun.toLocaleString()}\n`);

      return !hasFailure;

    } catch (error: any) {
      console.error('❌ Scheduled test error:', error);

      await supabase.from('ScheduledTest').update({
        lastRun: startTime.toISOString(),
        status: 'failed'
      }).eq('id', scheduledTest.id);

      return false;

    } finally {
      await this.closeBrowser();
    }
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'every_5_min':
        return new Date(now.getTime() + 5 * 60 * 1000);
      case 'every_15_min':
        return new Date(now.getTime() + 15 * 60 * 1000);
      case 'every_30_min':
        return new Date(now.getTime() + 30 * 60 * 1000);
      default:
        // Default: 1 hour
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }
}

// ============================================================================
// Agent
// ============================================================================

class CosmicQAAgent {
  private runner: LocalTestRunner;
  private channel: RealtimeChannel | null = null;
  private scheduledCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.runner = new LocalTestRunner();
  }

  async start(): Promise<void> {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CosmicQA Local Test Runner Agent                    ║
║                                                           ║
║   Özellikler:                                             ║
║   • Manuel testleri dinler ve çalıştırır                 ║
║   • Zamanlanmış testleri otomatik çalıştırır             ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

    // Check for any queued executions on startup
    await this.processQueuedExecutions();

    // Check for scheduled tests on startup
    await this.processScheduledTests();

    // Start periodic scheduled test check
    this.startScheduledTestChecker();

    // Subscribe to new executions
    this.channel = supabase
      .channel('agent-executions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Execution',
          filter: 'status=eq.queued'
        },
        async (payload) => {
          console.log('📥 New queued execution detected');
          await this.runner.runExecution(payload.new as Execution);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Execution',
          filter: 'status=eq.queued'
        },
        async (payload) => {
          // Handle executions that were updated to 'queued' status
          if (payload.new && (payload.new as Execution).status === 'queued') {
            console.log('📥 Execution status changed to queued');
            await this.runner.runExecution(payload.new as Execution);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to Supabase Realtime');
          console.log('👂 Listening for queued executions...\n');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection error');
        }
      });
  }

  async processQueuedExecutions(): Promise<void> {
    console.log('🔍 Checking for queued executions...');

    const { data: executions, error } = await supabase
      .from('Execution')
      .select('*')
      .eq('status', 'queued')
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Error fetching queued executions:', error);
      return;
    }

    if (executions && executions.length > 0) {
      console.log(`📋 Found ${executions.length} queued execution(s)`);

      for (const execution of executions) {
        await this.runner.runExecution(execution);
      }
    } else {
      console.log('📭 No queued executions found');
    }
  }

  async processScheduledTests(): Promise<void> {
    const now = new Date();
    console.log(`📅 Checking for scheduled tests... (${now.toLocaleTimeString()})`);

    // Find scheduled tests that are due
    const { data: scheduledTests, error } = await supabase
      .from('ScheduledTest')
      .select('*')
      .eq('enabled', true)
      .in('status', ['active', 'failed']) // Include failed ones for retry
      .lte('nextRun', now.toISOString());

    if (error) {
      console.error('Error fetching scheduled tests:', error);
      return;
    }

    if (!scheduledTests || scheduledTests.length === 0) {
      console.log('📭 No scheduled tests are due');
      return;
    }

    console.log(`📋 Found ${scheduledTests.length} scheduled test(s) to run`);

    for (const scheduledTest of scheduledTests) {
      // Fetch the actual test
      const { data: test, error: testError } = await supabase
        .from('Test')
        .select('*')
        .eq('id', scheduledTest.testId)
        .single();

      if (testError || !test) {
        console.error(`❌ Test not found for scheduled test: ${scheduledTest.name}`);
        continue;
      }

      await this.runner.runScheduledTest(scheduledTest, test);
    }
  }

  private startScheduledTestChecker(): void {
    console.log(`⏰ Starting scheduled test checker (every ${SCHEDULED_CHECK_INTERVAL / 1000}s)`);

    this.scheduledCheckInterval = setInterval(async () => {
      await this.processScheduledTests();
    }, SCHEDULED_CHECK_INTERVAL);
  }

  async stop(): Promise<void> {
    console.log('\n👋 Shutting down agent...');

    if (this.channel) {
      await supabase.removeChannel(this.channel);
    }

    if (this.scheduledCheckInterval) {
      clearInterval(this.scheduledCheckInterval);
    }

    console.log('✅ Agent stopped');
    process.exit(0);
  }
}

// ============================================================================
// Main
// ============================================================================

const agent = new CosmicQAAgent();

// Handle shutdown
process.on('SIGINT', () => agent.stop());
process.on('SIGTERM', () => agent.stop());

// Start agent
agent.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

