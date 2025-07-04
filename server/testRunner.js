const { chromium, expect } = require('playwright');
const path = require('path');
const fs = require('fs-extra');

class TestRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotsDir = path.join(__dirname, 'screenshots');
    
    // Ensure screenshots directory exists
    fs.ensureDirSync(this.screenshotsDir);
  }

  async initializeBrowser(options = {}) {
    const {
      headless = false,
      viewport = { width: 1280, height: 720 },
      timeout = 30000
    } = options;

    this.browser = await chromium.launch({ 
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport,
      recordVideo: { dir: path.join(__dirname, 'videos') }
    });
    
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(timeout);
    
    // Add console logging
    this.page.on('console', msg => {
      console.log(`Browser console: ${msg.text()}`);
    });
    
    // Add error handling
    this.page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  }

  async closeBrowser() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }

  async executeStep(step, executionId) {
    const stepResult = {
      success: false,
      startTime: new Date(),
      logs: [],
      screenshot: null,
      error: null
    };

    try {
      // Initialize browser if not already done
      if (!this.browser) {
        await this.initializeBrowser();
      }

      console.log(`Executing step: ${step.type}`);
      stepResult.logs.push(`Starting step: ${step.type}`);

      // Execute the step based on its type
      switch (step.type) {
        case 'navigate':
          await this.executeNavigate(step.config);
          break;
          
        case 'click':
          await this.executeClick(step.config);
          break;
          
        case 'type':
          await this.executeType(step.config);
          break;
          
        case 'wait':
          await this.executeWait(step.config);
          break;
          
        case 'screenshot':
          stepResult.screenshot = await this.executeScreenshot(step.config, executionId, step.stepId);
          break;
          
        case 'verify':
          await this.executeVerify(step.config);
          break;
          
        case 'scroll':
          await this.executeScroll(step.config);
          break;
          
        case 'hover':
          await this.executeHover(step.config);
          break;
          
        case 'key':
          await this.executeKey(step.config);
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      stepResult.success = true;
      stepResult.logs.push(`Step completed successfully: ${step.type}`);

    } catch (error) {
      stepResult.success = false;
      stepResult.error = error.message;
      stepResult.logs.push(`Step failed: ${error.message}`);
      
      // Take screenshot on error
      try {
        stepResult.screenshot = await this.takeErrorScreenshot(executionId, step.stepId);
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError);
      }
    }

    stepResult.endTime = new Date();
    stepResult.duration = stepResult.endTime - stepResult.startTime;

    return stepResult;
  }

  async executeNavigate(config) {
    let url = config.url || config.value || '';
    if (!url) {
      throw new Error('Navigate action requires a URL');
    }
    
    // Yalın URL'leri destekle (örn: google.com -> https://google.com)
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async executeClick(config) {
    const selector = config.selector || config.target || '';
    if (!selector) {
      throw new Error('Click action requires a selector');
    }
    
    console.log(`Clicking element: ${selector}`);
    
    // Wait for element to be visible and clickable
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.click(selector);
  }

  async executeType(config) {
    const selector = config.selector || config.target || '';
    const text = config.text || config.value || '';
    
    if (!selector) {
      throw new Error('Type action requires a selector');
    }
    
    console.log(`Typing into element: ${selector}`);
    
    // Wait for element to be visible
    await this.page.waitForSelector(selector, { state: 'visible' });
    
    // Clear existing text and type new text
    await this.page.fill(selector, text);
  }

  async executeWait(config) {
    const duration = parseInt(config.duration || config.amount || 1000);
    console.log(`Waiting for: ${duration}ms`);
    await this.page.waitForTimeout(duration);
  }

  async executeScreenshot(config, executionId, stepId) {
    const filename = config.filename || `${executionId}-${stepId}-screenshot.png`;
    const screenshotPath = path.join(this.screenshotsDir, filename);
    
    console.log(`Taking screenshot: ${filename}`);
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: config.fullPage || false
    });
    
    return `/screenshots/${filename}`;
  }

  async executeVerify(config) {
    const selector = config.selector || config.target || '';
    const expectedValue = config.expectedValue || config.text || '';
    const verificationType = config.verificationType || 'text';
    
    if (!selector) {
      throw new Error('Verify action requires a selector');
    }

    console.log(`Verifying element: ${selector} (${verificationType})`);

    const locator = this.page.locator(selector);

    switch (verificationType) {
      case 'text':
        await expect(locator).toHaveText(expectedValue);
        break;
      case 'visible':
        await expect(locator).toBeVisible();
        break;
      case 'hidden':
        await expect(locator).toBeHidden();
        break;
      case 'enabled':
        await expect(locator).toBeEnabled();
        break;
      case 'disabled':
        await expect(locator).toBeDisabled();
        break;
      case 'contains':
        await expect(locator).toContainText(expectedValue);
        break;
      case 'value':
        await expect(locator).toHaveValue(expectedValue);
        break;
      default:
        await expect(locator).toHaveText(expectedValue);
    }
  }

  async executeScroll(config) {
    const direction = config.direction || 'down';
    const amount = parseInt(config.amount || 500);
    
    console.log(`Scrolling: ${direction} by ${amount}px`);
    
    switch (direction) {
      case 'up':
        await this.page.mouse.wheel(0, -amount);
        break;
      case 'down':
        await this.page.mouse.wheel(0, amount);
        break;
      case 'left':
        await this.page.mouse.wheel(-amount, 0);
        break;
      case 'right':
        await this.page.mouse.wheel(amount, 0);
        break;
      case 'top':
        await this.page.evaluate(() => window.scrollTo(0, 0));
        break;
      case 'bottom':
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
      default:
        await this.page.mouse.wheel(0, amount);
    }
    
    // Wait a bit for scroll to complete
    await this.page.waitForTimeout(500);
  }

  async executeHover(config) {
    const selector = config.selector || config.target || '';
    if (!selector) {
      throw new Error('Hover action requires a selector');
    }
    
    console.log(`Hovering over element: ${selector}`);
    
    // Wait for element to be visible
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.hover(selector);
  }

  async executeKey(config) {
    const key = config.key || config.value || '';
    if (!key) {
      throw new Error('Key action requires a key value');
    }
    
    console.log(`Pressing key: ${key}`);
    await this.page.keyboard.press(key);
  }

  async takeErrorScreenshot(executionId, stepId) {
    try {
      const filename = `${executionId}-${stepId}-error.png`;
      const screenshotPath = path.join(this.screenshotsDir, filename);
      
      if (this.page) {
        await this.page.screenshot({ 
          path: screenshotPath,
          fullPage: true
        });
        return `/screenshots/${filename}`;
      }
    } catch (error) {
      console.error('Failed to take error screenshot:', error);
    }
    return null;
  }

  // Utility method to check if element exists
  async elementExists(selector) {
    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }

  // Utility method to wait for element with custom timeout
  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { 
        state: 'visible', 
        timeout 
      });
      return true;
    } catch (error) {
      console.error(`Element not found: ${selector}`);
      return false;
    }
  }

  // Get current page info
  async getPageInfo() {
    if (!this.page) return null;
    
    try {
      return {
        url: this.page.url(),
        title: await this.page.title(),
        viewport: this.page.viewportSize()
      };
    } catch (error) {
      console.error('Failed to get page info:', error);
      return null;
    }
  }
}

module.exports = TestRunner; 