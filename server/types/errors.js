/**
 * Error types and categories for CosmicQA
 */

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
export const ERROR_CATEGORY = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NETWORK: 'network',
  DATABASE: 'database',
  FILESYSTEM: 'filesystem',
  EXTERNAL_API: 'external_api',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  PLAYWRIGHT: 'playwright',
  TEST_EXECUTION: 'test_execution',
  SCHEDULER: 'scheduler',
  WEBSOCKET: 'websocket'
};

// Error codes
export const ERROR_CODES = {
  // Validation errors (1000-1999)
  VALIDATION_ERROR: 1001,
  INVALID_INPUT: 1002,
  MISSING_REQUIRED_FIELD: 1003,
  INVALID_FORMAT: 1004,
  INVALID_RANGE: 1005,
  
  // Authentication errors (2000-2999)
  AUTH_REQUIRED: 2001,
  INVALID_CREDENTIALS: 2002,
  TOKEN_EXPIRED: 2003,
  TOKEN_INVALID: 2004,
  SESSION_EXPIRED: 2005,
  
  // Authorization errors (3000-3999)
  PERMISSION_DENIED: 3001,
  INSUFFICIENT_PRIVILEGES: 3002,
  RESOURCE_ACCESS_DENIED: 3003,
  
  // Network errors (4000-4999)
  NETWORK_ERROR: 4001,
  CONNECTION_TIMEOUT: 4002,
  CONNECTION_REFUSED: 4003,
  DNS_ERROR: 4004,
  SSL_ERROR: 4005,
  
  // Database errors (5000-5999)
  DATABASE_CONNECTION_ERROR: 5001,
  QUERY_ERROR: 5002,
  CONSTRAINT_VIOLATION: 5003,
  TRANSACTION_ERROR: 5004,
  MIGRATION_ERROR: 5005,
  
  // Filesystem errors (6000-6999)
  FILE_NOT_FOUND: 6001,
  FILE_ACCESS_DENIED: 6002,
  DISK_FULL: 6003,
  INVALID_PATH: 6004,
  FILE_CORRUPTED: 6005,
  
  // External API errors (7000-7999)
  EXTERNAL_API_ERROR: 7001,
  EXTERNAL_API_TIMEOUT: 7002,
  EXTERNAL_API_RATE_LIMIT: 7003,
  EXTERNAL_API_UNAVAILABLE: 7004,
  
  // Business logic errors (8000-8999)
  BUSINESS_RULE_VIOLATION: 8001,
  INVALID_OPERATION: 8002,
  RESOURCE_NOT_FOUND: 8003,
  RESOURCE_ALREADY_EXISTS: 8004,
  OPERATION_NOT_ALLOWED: 8005,
  
  // System errors (9000-9999)
  INTERNAL_SERVER_ERROR: 9001,
  SERVICE_UNAVAILABLE: 9002,
  CONFIGURATION_ERROR: 9003,
  MEMORY_ERROR: 9004,
  CPU_ERROR: 9005,
  
  // Playwright errors (10000-10999)
  PLAYWRIGHT_BROWSER_ERROR: 10001,
  PLAYWRIGHT_PAGE_ERROR: 10002,
  PLAYWRIGHT_ELEMENT_ERROR: 10003,
  PLAYWRIGHT_TIMEOUT_ERROR: 10004,
  PLAYWRIGHT_NETWORK_ERROR: 10005,
  
  // Test execution errors (11000-11999)
  TEST_EXECUTION_ERROR: 11001,
  TEST_STEP_ERROR: 11002,
  TEST_TIMEOUT: 11003,
  TEST_ASSERTION_ERROR: 11004,
  TEST_ENVIRONMENT_ERROR: 11005,
  
  // Scheduler errors (12000-12999)
  SCHEDULER_ERROR: 12001,
  CRON_INVALID: 12002,
  SCHEDULE_CONFLICT: 12003,
  SCHEDULE_NOT_FOUND: 12004,
  
  // WebSocket errors (13000-13999)
  WEBSOCKET_CONNECTION_ERROR: 13001,
  WEBSOCKET_MESSAGE_ERROR: 13002,
  WEBSOCKET_AUTHENTICATION_ERROR: 13003
};

// Error type definitions
export const ERROR_TYPES = {
  [ERROR_CODES.VALIDATION_ERROR]: {
    name: 'ValidationError',
    category: ERROR_CATEGORY.VALIDATION,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'Geçersiz veri formatı',
    description: 'Gönderilen veri formatı geçersiz veya eksik'
  },
  [ERROR_CODES.AUTH_REQUIRED]: {
    name: 'AuthenticationError',
    category: ERROR_CATEGORY.AUTHENTICATION,
    severity: ERROR_SEVERITY.HIGH,
    message: 'Kimlik doğrulama gerekli',
    description: 'Bu işlem için kimlik doğrulama gerekli'
  },
  [ERROR_CODES.PERMISSION_DENIED]: {
    name: 'PermissionError',
    category: ERROR_CATEGORY.AUTHORIZATION,
    severity: ERROR_SEVERITY.HIGH,
    message: 'Yetki hatası',
    description: 'Bu işlem için yeterli yetkiye sahip değilsiniz'
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    name: 'NetworkError',
    category: ERROR_CATEGORY.NETWORK,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'Ağ bağlantı hatası',
    description: 'Ağ bağlantısında sorun oluştu'
  },
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: {
    name: 'DatabaseError',
    category: ERROR_CATEGORY.DATABASE,
    severity: ERROR_SEVERITY.CRITICAL,
    message: 'Veritabanı hatası',
    description: 'Veritabanı bağlantısında sorun oluştu'
  },
  [ERROR_CODES.FILE_NOT_FOUND]: {
    name: 'FileSystemError',
    category: ERROR_CATEGORY.FILESYSTEM,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'Dosya sistemi hatası',
    description: 'Dosya işlemlerinde sorun oluştu'
  },
  [ERROR_CODES.PLAYWRIGHT_BROWSER_ERROR]: {
    name: 'PlaywrightError',
    category: ERROR_CATEGORY.PLAYWRIGHT,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'Playwright hatası',
    description: 'Browser otomasyonunda sorun oluştu'
  },
  [ERROR_CODES.TEST_EXECUTION_ERROR]: {
    name: 'TestExecutionError',
    category: ERROR_CATEGORY.TEST_EXECUTION,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'Test çalıştırma hatası',
    description: 'Test çalıştırılırken sorun oluştu'
  },
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: {
    name: 'InternalServerError',
    category: ERROR_CATEGORY.SYSTEM,
    severity: ERROR_SEVERITY.CRITICAL,
    message: 'Sunucu hatası',
    description: 'Beklenmeyen bir sunucu hatası oluştu'
  }
};

// Error context types
export const ERROR_CONTEXT = {
  EXECUTION: 'execution',
  STEP: 'step',
  API_REQUEST: 'api_request',
  WEBSOCKET: 'websocket',
  SCHEDULER: 'scheduler',
  FILE_OPERATION: 'file_operation',
  DATABASE_OPERATION: 'database_operation',
  EXTERNAL_API: 'external_api'
};

// Error recovery strategies
export const RECOVERY_STRATEGY = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  SKIP: 'skip',
  ABORT: 'abort',
  NOTIFY: 'notify'
};


