/**
 * CosmicQA Scheduled Test Runner
 * 
 * Bu script GitHub Actions tarafından çalıştırılır.
 * Zamanı gelen scheduled testleri bulur ve çalıştırır.
 * 
 * Kullanım:
 *   npx tsx agent/scheduled-runner.ts
 */

import { createClient } from '@supabase/supabase-js';
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Types
// ============================================================================

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

interface Step {
  stepId: string;
  type: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  config: any;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
}

// ============================================================================
// Test Runner (simplified for scheduled tests)
// ============================================================================

class ScheduledTestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async initializeBrowser(browserType: string, headless: boolean): Promise<void> {
    console.log(`🌐 Launching ${browserType} browser (headless: ${headless})...`);
    
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
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    this.page = await this.context.newPage();
  }

  async closeBrowser(): Promise<void> {
    if (this.page) await this.page.close().catch(() => {});
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    
    this.page = null;
    this.context = null;
    this.browser = null;
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
            await this.page.waitForTimeout(config.duration || 1000);
          }
          break;
        case 'assert':
          if (config.type === 'visible') {
            await this.page.waitForSelector(config.selector, { state: 'visible', timeout: 10000 });
          } else if (config.type === 'text') {
            const text = await this.page.textContent(config.selector);
            if (!text?.includes(config.expectedValue)) {
              throw new Error(`Text assertion failed`);
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
        default:
          console.warn(`⚠️ Unknown step type: ${type}`);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async runTest(scheduledTest: ScheduledTest, test: Test): Promise<boolean> {
    const startTime = new Date();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Running scheduled test: ${scheduledTest.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const workflow = JSON.parse(test.workflow || '[]');
      const steps: Step[] = workflow.map((step: any) => ({
        stepId: step.id,
        type: step.type,
        status: 'pending',
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
      await this.initializeBrowser(test.browserType || 'chromium', true);

      let hasFailure = false;

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
          break;
        } else {
          console.log(`   ✅ Passed (${step.duration}ms)`);
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
        progress: 100,
        successRate,
        error: hasFailure ? steps.find(s => s.error)?.error : null
      }).eq('id', executionId);

      // Update scheduled test
      await supabase.from('ScheduledTest').update({
        lastRun: startTime.toISOString(),
        lastDuration: duration,
        successRate: successRate,
        status: hasFailure ? 'failed' : 'active'
      }).eq('id', scheduledTest.id);

      console.log(`\n${hasFailure ? '❌' : '✅'} Test ${hasFailure ? 'FAILED' : 'PASSED'} (${duration}ms)\n`);

      return !hasFailure;

    } catch (error: any) {
      console.error('❌ Test error:', error);
      
      await supabase.from('ScheduledTest').update({
        lastRun: startTime.toISOString(),
        status: 'failed'
      }).eq('id', scheduledTest.id);

      return false;

    } finally {
      await this.closeBrowser();
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📅 CosmicQA Scheduled Test Runner                      ║
║                                                           ║
║   Running scheduled tests that are due...                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  const runner = new ScheduledTestRunner();
  const now = new Date();

  // Find scheduled tests that are due
  const { data: scheduledTests, error } = await supabase
    .from('ScheduledTest')
    .select('*')
    .eq('enabled', true)
    .eq('status', 'active')
    .lte('nextRun', now.toISOString());

  if (error) {
    console.error('Error fetching scheduled tests:', error);
    process.exit(1);
  }

  if (!scheduledTests || scheduledTests.length === 0) {
    console.log('📭 No scheduled tests are due at this time');
    process.exit(0);
  }

  console.log(`📋 Found ${scheduledTests.length} scheduled test(s) to run\n`);

  let passed = 0;
  let failed = 0;

  for (const scheduledTest of scheduledTests) {
    // Fetch the actual test
    const { data: test, error: testError } = await supabase
      .from('Test')
      .select('*')
      .eq('id', scheduledTest.testId)
      .single();

    if (testError || !test) {
      console.error(`❌ Test not found for scheduled test: ${scheduledTest.name}`);
      failed++;
      continue;
    }

    const success = await runner.runTest(scheduledTest, test);
    
    if (success) {
      passed++;
    } else {
      failed++;
    }

    // Calculate next run based on schedule/frequency
    // For now, just set it to 1 hour from now (can be improved with cron parsing)
    const nextRun = new Date(Date.now() + 60 * 60 * 1000);
    await supabase.from('ScheduledTest').update({
      nextRun: nextRun.toISOString()
    }).eq('id', scheduledTest.id);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

