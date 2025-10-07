// Client-side environment configuration
export const config = {
  // API URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  
  // App info
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'CosmicQA',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// API endpoints helper
export const apiEndpoints = {
  execute: `${config.apiUrl}/api/execute`,
  execution: (id: string) => `${config.apiUrl}/api/execution/${id}`,
  executions: `${config.apiUrl}/api/executions`,
  results: (id: string) => `${config.apiUrl}/api/results/${id}`,
  tests: `${config.apiUrl}/api/tests`,
  test: (id: string) => `${config.apiUrl}/api/tests/${id}`,
  scheduledTests: `${config.apiUrl}/api/scheduled-tests`,
  scheduledTest: (id: string) => `${config.apiUrl}/api/scheduled-tests/${id}`,
  health: `${config.apiUrl}/api/health`,
  screenshots: (filename: string) => `${config.apiUrl}/screenshots/${filename}`,
  videos: (filename: string) => `${config.apiUrl}/videos/${filename}`,
} as const;

// Server-side only config (for API routes)
export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Test runner defaults
  defaultBrowser: process.env.DEFAULT_BROWSER || 'chromium',
  defaultHeadless: process.env.DEFAULT_HEADLESS === 'true',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000', 10),
  defaultViewportWidth: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH || '1280', 10),
  defaultViewportHeight: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT || '720', 10),
  
  // Storage paths
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
} as const;
