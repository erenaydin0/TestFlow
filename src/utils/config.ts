/**
 * Merkezi Configuration Dosyası
 * Tüm uygulama genelinde kullanılan sabit değerler ve environment variable'ları burada yönetilir
 */

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Client-side environment configuration
 * NEXT_PUBLIC_ prefix'i olan değişkenler client-side'da kullanılabilir
 */
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  
  // App Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'CosmicQA',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // API Timeouts
  apiTimeout: 10000, // 10 seconds
  wsReconnectInterval: 3000, // 3 seconds
  
  // Notification Defaults
  notification: {
    defaultDuration: 5000, // 5 seconds
    shortDuration: 3000, // 3 seconds
    mediumDuration: 4000, // 4 seconds
    longDuration: 8000, // 8 seconds
    autoSaveInterval: 5000, // 5 seconds
    duplicateCheckWindow: 5000, // 5 seconds
    toastDuplicateCheckWindow: 3000, // 3 seconds
  },
  
  // Pagination Defaults
  defaultPageSize: 10,
  defaultPageSizeOptions: [10, 20, 50, 100],
  
  // Dashboard Defaults
  defaultDateRange: 14, // days
  maxRecentTests: 5,
  
  // Storage Keys
  storageKeys: {
    workflows: 'CosmicQA_saved_workflows',
    notifications: 'testflow_notifications',
    idCounter: 'testflow_notification_counter',
    browserSettings: 'browserSettings',
    theme: 'theme',
    locale: 'locale',
  },
  
  // UI Constants
  ui: {
    animationDuration: 300, // milliseconds
    toastDuration: 5000, // milliseconds
    debounceDelay: 300, // milliseconds
    zIndex: {
      dropdown: 1000,
      modal: 2000,
      toast: 3000,
      tooltip: 4000,
    },
  },
  
  // Error Handling
  error: {
    maxLogSize: 50,
    showDetailsInProduction: false,
  },
} as const;

// ============================================================================
// API URL HELPERS
// ============================================================================

/**
 * API base URL - en çok kullanılan helper
 */
export const API_URL = config.apiUrl;

/**
 * WebSocket URL helper
 */
export const WS_URL = config.wsUrl;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Config = typeof config;
export type StorageKeys = typeof config.storageKeys;
export type UIConfig = typeof config.ui;

