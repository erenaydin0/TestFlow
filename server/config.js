// Server configuration - Load from environment variables
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Test runner defaults
  defaultBrowser: process.env.DEFAULT_BROWSER || 'chromium',
  defaultHeadless: process.env.DEFAULT_HEADLESS === 'true',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000', 10),
  defaultViewport: {
    width: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH || '1280', 10),
    height: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT || '720', 10)
  },
  
  // Storage paths (relative to server directory)
  executionsDir: process.env.EXECUTIONS_DIR || './executions',
  screenshotsDir: process.env.SCREENSHOTS_DIR || './screenshots',
  videosDir: process.env.VIDEOS_DIR || './videos',
  testsDir: process.env.TESTS_DIR || './tests',
  scheduledTestsDir: process.env.SCHEDULED_TESTS_DIR || './scheduled-tests',
  
  // Cleanup config
  autoCleanupEnabled: process.env.AUTO_CLEANUP_ENABLED === 'true',
  cleanupRetentionDays: parseInt(process.env.CLEANUP_RETENTION_DAYS || '30', 10),
  maxExecutionFiles: parseInt(process.env.MAX_EXECUTION_FILES || '1000', 10),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
  
  // Helpers
  isDevelopment() {
    return this.nodeEnv === 'development';
  },
  isProduction() {
    return this.nodeEnv === 'production';
  }
};

module.exports = config;
