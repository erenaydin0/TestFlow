// Server configuration - Load from environment variables
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ES modules için __dirname ve __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  logToFile: process.env.LOG_TO_FILE !== 'false', // Default: true
  
  // Alerting
  alertProvider: process.env.ALERT_PROVIDER || 'console',
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
  alertEmailTo: process.env.ALERT_EMAIL_TO,
  alertEmailFrom: process.env.ALERT_EMAIL_FROM,
  
  // Helpers
  isDevelopment() {
    return this.nodeEnv === 'development';
  },
  isProduction() {
    return this.nodeEnv === 'production';
  }
};

export default config;
