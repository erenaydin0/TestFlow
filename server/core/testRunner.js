import { chromium, firefox, webkit } from 'playwright';
import { expect } from '@playwright/test';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestRunner {
  constructor(screenshotsDir = null) {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.currentBrowserType = null; // Track current browser type
    this.screenshotsDir = screenshotsDir || path.join(__dirname, '../storage/screenshots');

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

    logger.info('Launching browser:', { browserType, headless });

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
      logger.info('✅ Browser launched successfully:', { browserType });
    } catch (error) {
      logger.error('❌ Failed to launch browser', { browserType, error: error.message });
      logger.info('🔄 Falling back to chromium...');
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
      logger.info('Video recording enabled for execution:', { executionId });
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(timeout);

    // Add console logging (only in debug mode)
    const config = (await import('./config.js')).default;
    if (config.enableDebugLogs) {
      this.page.on('console', msg => {
        logger.debug(`Browser console: ${msg.text()}`);
      });
    }

    // Add error handling
    this.page.on('pageerror', error => {
      logger.error(`Page error: ${error.message}`);
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
        logger.info('Browser context closed, video saved if recording was enabled');

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
      logger.error('Error closing browser:', { error: error.message });
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
          logger.info('🔒 Closing existing browser before switching...');
          await this.closeBrowser();
        }

        await this.initializeBrowser({
          headless: options.headlessMode || false,
          enableRecording: options.enableRecording || false,
          browserType: requestedBrowserType
        });
      } else {
        logger.info(`♻️ Reusing existing browser: ${this.currentBrowserType}`);
      }

      logger.info(`Executing step: ${step.type}`);
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

        case 'verify':
          await this.executeVerify(step.config);
          break;

        case 'dropdown':
          await this.executeDropdown(step.config);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Take automatic screenshot if enabled
      if (options.enableScreenshots) {
        logger.debug('Taking automatic screenshot for step:', { stepId: step.stepId });
        try {
          stepResult.screenshot = await this.takeScreenshot(executionId, `${step.stepId}-auto`);
          stepResult.logs.push('Automatic screenshot taken');
          logger.debug('Automatic screenshot saved:', { path: stepResult.screenshot });
        } catch (screenshotError) {
          logger.error('Failed to take automatic screenshot:', { error: screenshotError.message });
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
        logger.error('Failed to take error screenshot:', { error: screenshotError.message });
      }
    }

    stepResult.endTime = new Date();
    stepResult.duration = stepResult.endTime - stepResult.startTime;

    return stepResult;
  }

  async executeNavigate(config) {
    console.log('executeNavigate called with config:', JSON.stringify(config, null, 2));

    let url = config.url || config.value || '';
    logger.debug('Extracted URL:', { url });

    if (!url) {
      logger.error('No URL found in config:', { config });
      throw new Error('Navigate action requires a URL');
    }

    // Yalın URL'leri destekle (örn: google.com -> https://google.com)
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      logger.debug('URL normalized to:', { url });
    }

    logger.info(`Navigating to: ${url}`);

    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      logger.info('Navigation completed successfully');
    } catch (error) {
      logger.error('Navigation failed:', { error: error.message });
      throw error;
    }
  }

  async executeClick(config) {
    console.log('executeClick called with config:', JSON.stringify(config, null, 2));

    const rawSelector = config.selector || config.target || '';
    if (!rawSelector) {
      logger.error('No selector found in config:', { config });
      throw new Error('Click action requires a selector');
    }

    const selector = this.normalizeSelector(rawSelector);
    logger.debug(`Clicking element: ${rawSelector} -> normalized: ${selector}`);

    try {
      // Check if element exists first
      const elementExists = await this.elementExists(rawSelector);
      logger.debug(`Element exists: ${elementExists}`);

      if (!elementExists) {
        // Try to find similar elements for debugging
        const allElements = await this.page.$$('*');
        logger.debug(`Total elements on page: ${allElements.length}`);

        throw new Error(`Element not found: ${rawSelector}`);
      }

      // Wait for element to be visible and clickable
      logger.debug('Waiting for element to be visible...');
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });

      logger.debug('Element is visible, clicking...');
      await this.page.click(selector);
      logger.info('Click completed successfully');

    } catch (error) {
      logger.error('Click action failed:', { error: error.message });
      throw error;
    }
  }

  async executeType(config) {
    console.log('executeType called with config:', JSON.stringify(config, null, 2));

    const rawSelector = config.selector || config.target || '';
    const text = config.text || config.value || '';

    if (!rawSelector) {
      logger.error('No selector found in config:', { config });
      throw new Error('Type action requires a selector');
    }

    const selector = this.normalizeSelector(rawSelector);
    logger.debug(`Typing into element: ${rawSelector} -> normalized: ${selector}, text: "${text}"`);

    try {
      // Check if element exists first
      const elementExists = await this.elementExists(rawSelector);
      logger.debug(`Element exists: ${elementExists}`);

      if (!elementExists) {
        throw new Error(`Element not found: ${rawSelector}`);
      }

      // Wait for element to be visible
      logger.debug('Waiting for element to be visible...');
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });

      // Clear existing text and type new text
      logger.debug('Clearing and filling text...');
      await this.page.fill(selector, text);
      logger.info('Type completed successfully');

    } catch (error) {
      logger.error('Type action failed:', { error: error.message });
      throw error;
    }
  }

  async executeWait(config) {
    const duration = parseInt(config.duration || config.amount || 1000);
    logger.info(`Waiting for: ${duration}ms`);
    await this.page.waitForTimeout(duration);
  }

  async takeScreenshot(executionId, stepId, fullPage = false) {
    const filename = `${executionId}-${stepId}-screenshot.png`;
    const screenshotPath = path.join(this.screenshotsDir, filename);

    logger.debug(`Taking screenshot: ${filename}`);
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: fullPage
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
      logger.info(`Verifying URL: ${currentUrl} (${verificationType})`);

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
    logger.info(`Verifying element: ${rawSelector} -> normalized: ${selector} (${verificationType})`);

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



  async executeDropdown(config) {
    console.log('executeDropdown called with config:', JSON.stringify(config, null, 2));

    const rawSelector = config.selector || config.target || '';
    const optionType = config.optionType || 'value';
    const optionValue = config.optionValue || config.value || '';

    if (!rawSelector) {
      logger.error('No selector found in config:', { config });
      throw new Error('Dropdown action requires a selector');
    }

    if (!optionValue) {
      throw new Error('Dropdown action requires an option value');
    }

    const selector = this.normalizeSelector(rawSelector);
    logger.debug(`Selecting from dropdown: ${rawSelector} -> normalized: ${selector}, type: ${optionType}, value: "${optionValue}"`);

    try {
      // Check if element exists first
      const elementExists = await this.elementExists(rawSelector);
      logger.debug(`Dropdown element exists: ${elementExists}`);

      if (!elementExists) {
        throw new Error(`Dropdown element not found: ${rawSelector}`);
      }

      // Wait for element to be visible
      logger.debug('Waiting for dropdown element to be visible...');
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });

      // Select option based on type
      logger.debug(`Selecting option by ${optionType}: ${optionValue}`);

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

      logger.info('Dropdown selection completed successfully');

    } catch (error) {
      logger.error('Dropdown action failed:', { error: error.message });
      throw error;
    }
  }

  async executeRefresh(config) {
    logger.info('Refreshing page');
    await this.page.reload({ waitUntil: 'networkidle' });
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
      logger.error('Failed to take error screenshot:', { error: error.message });
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
      logger.error(`Element not found: ${rawSelector}`);
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
      logger.error('Failed to get page info:', { error: error.message });
      return null;
    }
  }
}

export default TestRunner; 