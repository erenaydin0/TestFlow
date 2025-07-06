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
      timeout = 30000,
      enableRecording = false,
      executionId = null
    } = options;

    this.browser = await chromium.launch({ 
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const contextOptions = {
      viewport
    };
    
    // Only enable video recording if explicitly requested
    if (enableRecording) {
      contextOptions.recordVideo = { 
        dir: path.join(__dirname, 'videos'),
        size: viewport
      };
      console.log('Video recording enabled for execution:', executionId);
    }
    
    this.context = await this.browser.newContext(contextOptions);
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
      if (this.context) {
        // Close context first to save video
        await this.context.close();
        console.log('Browser context closed, video saved if recording was enabled');
      }
      
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

  async executeStep(step, executionId, options = {}) {
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
          
        case 'input':  // Frontend sends 'input'
        case 'type':   // Keep backward compatibility
          await this.executeType(step.config);
          break;
          
        case 'wait':
          await this.executeWait(step.config);
          break;
          
        case 'refresh':
          await this.executeRefresh(step.config);
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
          
        case 'if':
          await this.executeIf(step.config);
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Take automatic screenshot if enabled
      if (options.enableScreenshots && step.type !== 'screenshot') {
        console.log('Taking automatic screenshot for step:', step.stepId);
        try {
          stepResult.screenshot = await this.executeScreenshot({}, executionId, `${step.stepId}-auto`);
          stepResult.logs.push('Automatic screenshot taken');
          console.log('Automatic screenshot saved:', stepResult.screenshot);
        } catch (screenshotError) {
          console.error('Failed to take automatic screenshot:', screenshotError);
        }
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
    console.log('executeNavigate called with config:', JSON.stringify(config, null, 2));
    
    let url = config.url || config.value || '';
    console.log('Extracted URL:', url);
    
    if (!url) {
      console.error('No URL found in config:', config);
      throw new Error('Navigate action requires a URL');
    }
    
    // Yalın URL'leri destekle (örn: google.com -> https://google.com)
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      console.log('URL normalized to:', url);
    }
    
    console.log(`Navigating to: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('Navigation completed successfully');
    } catch (error) {
      console.error('Navigation failed:', error.message);
      throw error;
    }
  }

  async executeClick(config) {
    console.log('executeClick called with config:', JSON.stringify(config, null, 2));
    
    const selector = config.selector || config.target || '';
    if (!selector) {
      console.error('No selector found in config:', config);
      throw new Error('Click action requires a selector');
    }
    
    console.log(`Clicking element: ${selector}`);
    
    try {
      // Check if element exists first
      const elementExists = await this.elementExists(selector);
      console.log(`Element exists: ${elementExists}`);
      
      if (!elementExists) {
        // Try to find similar elements for debugging
        const allElements = await this.page.$$('*');
        console.log(`Total elements on page: ${allElements.length}`);
        
        throw new Error(`Element not found: ${selector}`);
      }
      
      // Wait for element to be visible and clickable
      console.log('Waiting for element to be visible...');
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      
      console.log('Element is visible, clicking...');
      await this.page.click(selector);
      console.log('Click completed successfully');
      
    } catch (error) {
      console.error('Click action failed:', error.message);
      
      // Take a screenshot for debugging
      try {
        await this.page.screenshot({ path: `debug-click-error-${Date.now()}.png` });
        console.log('Debug screenshot taken');
      } catch (screenshotError) {
        console.error('Failed to take debug screenshot:', screenshotError);
      }
      
      throw error;
    }
  }

  async executeType(config) {
    console.log('executeType called with config:', JSON.stringify(config, null, 2));
    
    const selector = config.selector || config.target || '';
    const text = config.text || config.value || '';
    
    if (!selector) {
      console.error('No selector found in config:', config);
      throw new Error('Type action requires a selector');
    }
    
    console.log(`Typing into element: ${selector}, text: "${text}"`);
    
    try {
      // Check if element exists first
      const elementExists = await this.elementExists(selector);
      console.log(`Element exists: ${elementExists}`);
      
      if (!elementExists) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      // Wait for element to be visible
      console.log('Waiting for element to be visible...');
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      
      // Clear existing text and type new text
      console.log('Clearing and filling text...');
      await this.page.fill(selector, text);
      console.log('Type completed successfully');
      
    } catch (error) {
      console.error('Type action failed:', error.message);
      
      // Take a screenshot for debugging
      try {
        await this.page.screenshot({ path: `debug-type-error-${Date.now()}.png` });
        console.log('Debug screenshot taken');
      } catch (screenshotError) {
        console.error('Failed to take debug screenshot:', screenshotError);
      }
      
      throw error;
    }
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

  async executeRefresh(config) {
    console.log('Refreshing page');
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async executeIf(config) {
    const condition = config.condition || config.selector || '';
    if (!condition) {
      throw new Error('If action requires a condition selector');
    }
    
    console.log(`Checking condition: ${condition}`);
    
    try {
      // Check if element exists and is visible
      await this.page.waitForSelector(condition, { state: 'visible', timeout: 5000 });
      console.log('Condition is TRUE - element found and visible');
      return true;
    } catch (error) {
      console.log('Condition is FALSE - element not found or not visible');
      return false;
    }
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