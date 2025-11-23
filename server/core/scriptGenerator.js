class ScriptGenerator {
  constructor() {
    this.actionMapping = {
      'navigate': this.generateNavigate,
      'click': this.generateClick,
      'type': this.generateType,
      'wait': this.generateWait,
      'verify': this.generateVerify,
      'dropdown': this.generateDropdown
    };
  }

  generateScript(steps) {
    const scriptLines = [
      "const { chromium } = require('playwright');",
      "",
      "async function runTest() {",
      "  const browser = await chromium.launch({ headless: false });",
      "  const context = await browser.newContext();",
      "  const page = await context.newPage();",
      "  ",
      "  try {"
    ];

    steps.forEach((step, index) => {
      const generator = this.actionMapping[step.type];
      if (generator) {
        const code = generator.call(this, step.config, index);
        scriptLines.push(`    // Step ${index + 1}: ${step.type}`);
        scriptLines.push(`    ${code}`);
        scriptLines.push("");
      } else {
        scriptLines.push(`    // Step ${index + 1}: Unknown action type '${step.type}'`);
        scriptLines.push(`    console.log('Skipping unknown action: ${step.type}');`);
        scriptLines.push("");
      }
    });

    scriptLines.push(...[
      "  } catch (error) {",
      "    console.error('Test execution failed:', error);",
      "    throw error;",
      "  } finally {",
      "    await browser.close();",
      "  }",
      "}",
      "",
      "module.exports = runTest;"
    ]);

    return scriptLines.join('\n');
  }

  generateNavigate(config, index) {
    let url = config.url || config.value || '';

    // Yalın URL'leri destekle (örn: google.com -> https://google.com)
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    return `await page.goto('${this.escapeString(url)}');`;
  }

  generateClick(config, index) {
    const selector = config.selector || config.target || '';
    if (!selector) {
      return `throw new Error('Click action requires a selector');`;
    }
    return `await page.click('${this.escapeString(selector)}');`;
  }

  generateType(config, index) {
    const selector = config.selector || config.target || '';
    const text = config.text || config.value || '';

    if (!selector) {
      return `throw new Error('Type action requires a selector');`;
    }

    return [
      `await page.fill('${this.escapeString(selector)}', '${this.escapeString(text)}');`
    ].join('\n    ');
  }

  generateWait(config, index) {
    const duration = parseInt(config.duration || config.amount || 1000);
    return `await page.waitForTimeout(${duration});`;
  }



  generateVerify(config, index) {
    const selector = config.selector || config.target || '';
    const expectedValue = config.expectedValue || config.text || '';
    const verificationType = config.verificationType || 'text';

    // URL kontrolü
    if (verificationType === 'url') {
      return `if (page.url() !== '${this.escapeString(expectedValue)}') { throw new Error(\`URL mismatch: expected "${this.escapeString(expectedValue)}", got "\${page.url()}"\`); }`;
    }

    if (verificationType === 'urlContains') {
      return `if (!page.url().includes('${this.escapeString(expectedValue)}')) { throw new Error(\`URL does not contain "${this.escapeString(expectedValue)}": got "\${page.url()}"\`); }`;
    }

    if (!selector) {
      return `throw new Error('Verify action requires a selector');`;
    }

    switch (verificationType) {
      case 'text':
        return `await expect(page.locator('${this.escapeString(selector)}')).toHaveText('${this.escapeString(expectedValue)}');`;
      case 'visible':
        return `await expect(page.locator('${this.escapeString(selector)}')).toBeVisible();`;
      case 'hidden':
        return `await expect(page.locator('${this.escapeString(selector)}')).toBeHidden();`;
      case 'enabled':
        return `await expect(page.locator('${this.escapeString(selector)}')).toBeEnabled();`;
      case 'disabled':
        return `await expect(page.locator('${this.escapeString(selector)}')).toBeDisabled();`;
      case 'contains':
        return `await expect(page.locator('${this.escapeString(selector)}')).toContainText('${this.escapeString(expectedValue)}');`;
      case 'value':
        return `await expect(page.locator('${this.escapeString(selector)}')).toHaveValue('${this.escapeString(expectedValue)}');`;
      default:
        return `await expect(page.locator('${this.escapeString(selector)}')).toHaveText('${this.escapeString(expectedValue)}');`;
    }
  }



  generateDropdown(config, index) {
    const selector = config.selector || config.target || '';
    const optionType = config.optionType || 'value';
    const optionValue = config.optionValue || config.value || '';

    if (!selector) {
      return `throw new Error('Dropdown action requires a selector');`;
    }

    if (!optionValue) {
      return `throw new Error('Dropdown action requires an option value');`;
    }

    let selectCode = '';
    if (optionType === 'value') {
      selectCode = `await page.selectOption('${this.escapeString(selector)}', { value: '${this.escapeString(optionValue)}' });`;
    } else if (optionType === 'text') {
      selectCode = `await page.selectOption('${this.escapeString(selector)}', { label: '${this.escapeString(optionValue)}' });`;
    } else if (optionType === 'index') {
      const index = parseInt(optionValue);
      if (isNaN(index)) {
        return `throw new Error('Invalid index value: ${optionValue}');`;
      }
      selectCode = `await page.selectOption('${this.escapeString(selector)}', { index: ${index} });`;
    } else {
      return `throw new Error('Unknown option type: ${optionType}');`;
    }

    return selectCode;
  }

  escapeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  // Generate step validation code
  generateStepValidation(step, index) {
    return [
      `console.log('Executing step ${index + 1}: ${step.type}');`,
      `const stepStartTime = Date.now();`
    ];
  }

  // Generate error handling for step
  generateStepErrorHandling(step, index) {
    return [
      `const stepEndTime = Date.now();`,
      `console.log('Step ${index + 1} completed in', stepEndTime - stepStartTime, 'ms');`
    ];
  }

  // Generate full executable script with error handling
  generateExecutableScript(steps, options = {}) {
    const {
      headless = false,
      viewport = { width: 1280, height: 720 },
      timeout = 30000,
      browserType = 'chromium'
    } = options;

    const browserImports = browserType === 'firefox' ? 'firefox' :
      browserType === 'webkit' ? 'webkit' : 'chromium';

    return `
const { ${browserImports}, expect } = require('playwright/test');

async function executeTestSteps(steps, executionId, onStepUpdate) {
  const browser = await ${browserImports}.launch({ 
    headless: ${headless},
    args: ['--no-sandbox', '--disable-setuid-sandbox']${browserType === 'msedge' ? ',\n    channel: "msedge"' : ''}
  });
  
  const context = await browser.newContext({
    viewport: ${JSON.stringify(viewport)}
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(${timeout});
  
  const results = [];
  
  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepResult = {
        stepId: step.stepId,
        success: false,
        startTime: new Date(),
        logs: [],
        screenshot: null,
        error: null
      };
      
      try {
        console.log(\`Executing step \${i + 1}: \${step.type}\`);
        
        // Execute the step based on its type
        switch (step.type) {
          case 'navigate':
            await page.goto(step.config.url || step.config.value);
            break;
            
          case 'click':
            await page.click(step.config.selector || step.config.target);
            break;
            
          case 'type':
            await page.fill(step.config.selector || step.config.target, step.config.text || step.config.value);
            break;
            
          case 'wait':
            await page.waitForTimeout(parseInt(step.config.duration || step.config.amount || 1000));
            break;
            
          case 'verify':
            const selector = step.config.selector || step.config.target;
            const expectedValue = step.config.expectedValue || step.config.text;
            await expect(page.locator(selector)).toHaveText(expectedValue);
            break;
            
          case 'dropdown':
            const dropdownSelector = step.config.selector || step.config.target;
            const optionType = step.config.optionType || 'value';
            const optionValue = step.config.optionValue || step.config.value;
            
            if (optionType === 'value') {
              await page.selectOption(dropdownSelector, { value: optionValue });
            } else if (optionType === 'text') {
              await page.selectOption(dropdownSelector, { label: optionValue });
            } else if (optionType === 'index') {
              await page.selectOption(dropdownSelector, { index: parseInt(optionValue) });
            }
            break;
            
          default:
            throw new Error(\`Unknown step type: \${step.type}\`);
        }
        
        stepResult.success = true;
        stepResult.logs.push(\`Step \${i + 1} (\${step.type}) executed successfully\`);
        
      } catch (error) {
        stepResult.success = false;
        stepResult.error = error.message;
        stepResult.logs.push(\`Step \${i + 1} (\${step.type}) failed: \${error.message}\`);
        
        // Take screenshot on error
        try {
          const errorScreenshotPath = \`./screenshots/\${executionId}-step-\${i + 1}-error.png\`;
          await page.screenshot({ path: errorScreenshotPath });
          stepResult.screenshot = errorScreenshotPath;
        } catch (screenshotError) {
          console.error('Failed to take error screenshot:', screenshotError);
        }
      }
      
      stepResult.endTime = new Date();
      results.push(stepResult);
      
      // Callback for real-time updates
      if (onStepUpdate) {
        onStepUpdate(i, stepResult);
      }
      
      // If step failed and it's critical, stop execution
      if (!stepResult.success && step.config.critical !== false) {
        break;
      }
    }
    
  } finally {
    await browser.close();
  }
  
  return results;
}

export { executeTestSteps };
`;
  }
}

export default ScriptGenerator; 