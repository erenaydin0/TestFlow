const { chromium, firefox, webkit } = require('playwright');
const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs-extra');

class TestRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.currentBrowserType = null; // Track current browser type
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
      executionId = null,
      browserType = 'chromium'
    } = options;

    console.log('Launching browser:', browserType, 'in headless mode:', headless);
    
    // Browser seçimi
    let browserEngine;
    switch (browserType) {
      case 'firefox':
        browserEngine = firefox;
        break;
      case 'webkit':
        browserEngine = webkit;
        break;
      case 'msedge':
        // Edge için chromium kullan ama channel belirt
        browserEngine = chromium;
        break;
      case 'chromium':
      default:
        browserEngine = chromium;
        break;
    }
    
    const launchOptions = { 
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    
    // Edge için özel kanal ayarı
    if (browserType === 'msedge') {
      launchOptions.channel = 'msedge';
    }
    

    try {
      this.browser = await browserEngine.launch(launchOptions);
      this.currentBrowserType = browserType; // Track current browser type
      console.log('✅ Browser launched successfully:', browserType);
    } catch (error) {
      console.error('❌ Failed to launch', browserType, '- Error:', error.message);
      console.log('🔄 Falling back to chromium...');
      this.browser = await chromium.launch(launchOptions);
      this.currentBrowserType = 'chromium'; // Track fallback browser type
    }
    
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
      let videoPath = null;
      
      if (this.context) {
        // Get video path before closing context
        if (this.page && this.page.video()) {
          videoPath = await this.page.video().path();
          console.log('Video will be saved at:', videoPath);
        }
        
        // Close context first to save video
        await this.context.close();
        console.log('Browser context closed, video saved if recording was enabled');
        
        // Wait a bit for video to be written
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
        this.currentBrowserType = null; // Reset browser type
      }
      
      return videoPath;
    } catch (error) {
      console.error('Error closing browser:', error);
      return null;
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
      // Initialize browser if not already done OR browser type changed
      const requestedBrowserType = options.browserType || 'chromium';
      const needsReinitialization = !this.browser || this.currentBrowserType !== requestedBrowserType;
      
      if (needsReinitialization) {
        console.log(`🔄 Browser reinitialization needed. Current: ${this.currentBrowserType}, Requested: ${requestedBrowserType}`);
        
        // Close existing browser if it exists
        if (this.browser) {
          console.log('🔒 Closing existing browser before switching...');
          await this.closeBrowser();
        }
        
        await this.initializeBrowser({
          headless: options.headlessMode || false,
          enableRecording: options.enableRecording || false,
          browserType: requestedBrowserType
        });
      } else {
        console.log(`♻️ Reusing existing browser: ${this.currentBrowserType}`);
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
          
        case 'dropdown':
          await this.executeDropdown(step.config);
          break;
          
        case 'if':
          stepResult.conditionResult = await this.executeIf(step.config);
          stepResult.logs.push(`Condition result: ${stepResult.conditionResult ? 'TRUE' : 'FALSE'}`);
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
    
    const rawSelector = config.selector || config.target || '';
    if (!rawSelector) {
      console.error('No selector found in config:', config);
      throw new Error('Click action requires a selector');
    }
    
    const selector = this.normalizeSelector(rawSelector);
    console.log(`Clicking element: ${rawSelector} -> normalized: ${selector}`);
    
    try {
      // Check if element exists first
      const elementExists = await this.elementExists(rawSelector);
      console.log(`Element exists: ${elementExists}`);
      
      if (!elementExists) {
        // Try to find similar elements for debugging
        const allElements = await this.page.$$('*');
        console.log(`Total elements on page: ${allElements.length}`);
        
        throw new Error(`Element not found: ${rawSelector}`);
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
        const debugScreenshotPath = path.join(this.screenshotsDir, `error-${Date.now()}.png`);
        await this.page.screenshot({ path: debugScreenshotPath });
        console.log('Debug screenshot taken:', debugScreenshotPath);
      } catch (screenshotError) {
        console.error('Failed to take debug screenshot:', screenshotError);
      }
      
      throw error;
    }
  }

  async executeType(config) {
    console.log('executeType called with config:', JSON.stringify(config, null, 2));
    
    const rawSelector = config.selector || config.target || '';
    const text = config.text || config.value || '';
    
    if (!rawSelector) {
      console.error('No selector found in config:', config);
      throw new Error('Type action requires a selector');
    }
    
    const selector = this.normalizeSelector(rawSelector);
    console.log(`Typing into element: ${rawSelector} -> normalized: ${selector}, text: "${text}"`);
    
    try {
      // Check if element exists first
      const elementExists = await this.elementExists(rawSelector);
      console.log(`Element exists: ${elementExists}`);
      
      if (!elementExists) {
        throw new Error(`Element not found: ${rawSelector}`);
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
        const debugScreenshotPath = path.join(this.screenshotsDir, `debug-type-error-${Date.now()}.png`);
        await this.page.screenshot({ path: debugScreenshotPath });
        console.log('Debug screenshot taken:', debugScreenshotPath);
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
    const rawSelector = config.selector || config.target || '';
    const expectedValue = config.expectedValue || config.text || '';
    const verificationType = config.verificationType || 'text';
    
    // URL kontrolü için selector gerekmez
    if (!rawSelector && verificationType !== 'url' && verificationType !== 'urlContains') {
      throw new Error('Verify action requires a selector');
    }

    // URL kontrolü
    if (verificationType === 'url' || verificationType === 'urlContains') {
      const currentUrl = this.page.url();
      console.log(`Verifying URL: ${currentUrl} (${verificationType})`);
      
      if (verificationType === 'url') {
        // Tam URL eşleşmesi
        if (currentUrl !== expectedValue) {
          throw new Error(`URL mismatch: expected "${expectedValue}", got "${currentUrl}"`);
        }
      } else if (verificationType === 'urlContains') {
        // URL içerir kontrolü
        if (!currentUrl.includes(expectedValue)) {
          throw new Error(`URL does not contain "${expectedValue}": got "${currentUrl}"`);
        }
      }
      return;
    }

    const selector = this.normalizeSelector(rawSelector);
    console.log(`Verifying element: ${rawSelector} -> normalized: ${selector} (${verificationType})`);

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
    const rawSelector = config.selector || config.target || '';
    if (!rawSelector) {
      throw new Error('Hover action requires a selector');
    }
    
    const selector = this.normalizeSelector(rawSelector);
    console.log(`Hovering over element: ${rawSelector} -> normalized: ${selector}`);
    
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

  async executeDropdown(config) {
    console.log('executeDropdown called with config:', JSON.stringify(config, null, 2));
    
    const rawSelector = config.selector || config.target || '';
    const optionType = config.optionType || 'value';
    const optionValue = config.optionValue || config.value || '';
    
    if (!rawSelector) {
      console.error('No selector found in config:', config);
      throw new Error('Dropdown action requires a selector');
    }
    
    if (!optionValue) {
      throw new Error('Dropdown action requires an option value');
    }
    
    const selector = this.normalizeSelector(rawSelector);
    console.log(`Selecting from dropdown: ${rawSelector} -> normalized: ${selector}, type: ${optionType}, value: "${optionValue}"`);
    
    try {
      // Check if element exists first
      const elementExists = await this.elementExists(rawSelector);
      console.log(`Dropdown element exists: ${elementExists}`);
      
      if (!elementExists) {
        throw new Error(`Dropdown element not found: ${rawSelector}`);
      }
      
      // Wait for element to be visible
      console.log('Waiting for dropdown element to be visible...');
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      
      // Select option based on type
      console.log(`Selecting option by ${optionType}: ${optionValue}`);
      
      if (optionType === 'value') {
        // Select by value attribute
        await this.page.selectOption(selector, { value: optionValue });
      } else if (optionType === 'text') {
        // Select by visible text
        await this.page.selectOption(selector, { label: optionValue });
      } else if (optionType === 'index') {
        // Select by index (0-based)
        const index = parseInt(optionValue);
        if (isNaN(index)) {
          throw new Error(`Invalid index value: ${optionValue}`);
        }
        await this.page.selectOption(selector, { index: index });
      } else {
        throw new Error(`Unknown option type: ${optionType}`);
      }
      
      console.log('Dropdown selection completed successfully');
      
    } catch (error) {
      console.error('Dropdown action failed:', error.message);
      
      // Take a screenshot for debugging
      try {
        const debugScreenshotPath = path.join(this.screenshotsDir, `debug-dropdown-error-${Date.now()}.png`);
        await this.page.screenshot({ path: debugScreenshotPath });
        console.log('Debug screenshot taken:', debugScreenshotPath);
      } catch (screenshotError) {
        console.error('Failed to take debug screenshot:', screenshotError);
      }
      
      throw error;
    }
  }

  async executeRefresh(config) {
    console.log('Refreshing page');
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async executeIf(config) {
    const conditionType = config.conditionType || 'visible';
    const rawSelector = config.selector || config.condition || '';
    const expectedValue = config.expectedValue || '';
    const operator = config.operator || 'equals';
    
    console.log(`Checking condition: type=${conditionType}, selector=${rawSelector}, expectedValue=${expectedValue}, operator=${operator}`);
    
    try {
      // URL kontrolü
      if (conditionType === 'url' || conditionType === 'urlContains') {
        const currentUrl = this.page.url();
        if (conditionType === 'url') {
          return currentUrl === expectedValue;
        } else {
          return currentUrl.includes(expectedValue);
        }
      }
      
      // Selector gerekli kontroller
      if (!rawSelector) {
        throw new Error('If action requires a selector for non-URL conditions');
      }
      
      const selector = this.normalizeSelector(rawSelector);
      const locator = this.page.locator(selector);
      
      switch (conditionType) {
        case 'exists':
          // Element var mı?
          const count = await locator.count();
          return count > 0;
          
        case 'visible':
          // Element görünür mü?
          try {
            await locator.first().waitFor({ state: 'visible', timeout: 5000 });
            return true;
          } catch {
            return false;
          }
          
        case 'hidden':
          // Element gizli mi?
          try {
            await locator.first().waitFor({ state: 'hidden', timeout: 5000 });
            return true;
          } catch {
            return false;
          }
          
        case 'text':
          // Metin eşit mi?
          try {
            const text = await locator.first().textContent();
            return text?.trim() === expectedValue.trim();
          } catch {
            return false;
          }
          
        case 'textContains':
          // Metin içeriyor mu?
          try {
            const text = await locator.first().textContent();
            return text?.includes(expectedValue) || false;
          } catch {
            return false;
          }
          
        case 'value':
          // Input değeri eşit mi?
          try {
            const value = await locator.first().inputValue();
            return value === expectedValue;
          } catch {
            return false;
          }
          
        case 'valueContains':
          // Input değeri içeriyor mu?
          try {
            const value = await locator.first().inputValue();
            return value.includes(expectedValue);
          } catch {
            return false;
          }
          
        case 'count':
          // Element sayısı kontrolü
          const elementCount = await locator.count();
          const expected = parseInt(expectedValue);
          
          switch (operator) {
            case 'equals':
              return elementCount === expected;
            case 'notEquals':
              return elementCount !== expected;
            case 'greaterThan':
              return elementCount > expected;
            case 'lessThan':
              return elementCount < expected;
            case 'greaterOrEqual':
              return elementCount >= expected;
            case 'lessOrEqual':
              return elementCount <= expected;
            default:
              return elementCount === expected;
          }
          
        default:
          // Varsayılan: element görünür mü?
          try {
            await locator.first().waitFor({ state: 'visible', timeout: 5000 });
            return true;
          } catch {
            return false;
          }
      }
    } catch (error) {
      console.log(`Condition check error: ${error.message}`);
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

  // Normalize selector to support different types (CSS, XPath, ID, Class)
  normalizeSelector(selector) {
    if (!selector) return selector;
    
    // If already an XPath selector in Playwright format, return as is
    if (selector.startsWith('xpath=')) {
      return selector;
    }
    
    // If it's an XPath expression (starts with // or /html), add xpath= prefix
    if (selector.startsWith('//') || selector.startsWith('/html') || selector.startsWith('//*')) {
      return `xpath=${selector}`;
    }
    
    // Convert ID selector (#id) to proper format
    if (selector.startsWith('#')) {
      return selector; // CSS ID selector works fine
    }
    
    // Convert class selector (.class) to proper format  
    if (selector.startsWith('.')) {
      return selector; // CSS class selector works fine
    }
    
    // CSS attribute selectors and complex selectors
    if (selector.includes('[') || selector.includes(' ') || selector.includes('>') || 
        selector.includes(':') || selector.includes(',')) {
      return selector; // Keep CSS selector as is
    }
    
    // If it's a plain string without special characters, try as ID first
    if (!selector.includes('.') && !selector.includes('#') && !selector.includes('//') && 
        !selector.includes('[') && selector.length > 0) {
      // Could be a plain ID, try as ID first
      return `#${selector}`;
    }
    
    // Return as is for other selectors
    return selector;
  }

  // Utility method to check if element exists
  async elementExists(selector) {
    try {
      const normalizedSelector = this.normalizeSelector(selector);
      const element = await this.page.$(normalizedSelector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }

  // Utility method to wait for element with custom timeout
  async waitForElement(rawSelector, timeout = 5000) {
    try {
      const selector = this.normalizeSelector(rawSelector);
      await this.page.waitForSelector(selector, { 
        state: 'visible', 
        timeout 
      });
      return true;
    } catch (error) {
      console.error(`Element not found: ${rawSelector}`);
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