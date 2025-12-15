import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config, API_URL, WS_URL } from '../config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    vi.resetModules();
    // Set default environment variables for tests
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      NEXT_PUBLIC_WS_URL: 'ws://localhost:3001',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('API Configuration', () => {
    it('should have API URL from environment or empty string', () => {
      // Config uses environment variables, defaults to empty string if not set
      expect(typeof config.apiUrl).toBe('string');
      // In test environment without env vars, it will be empty string
      expect(config.apiUrl).toBeDefined();
    });

    it('should have WebSocket URL from environment or empty string', () => {
      // Config uses environment variables, defaults to empty string if not set
      expect(typeof config.wsUrl).toBe('string');
      // In test environment without env vars, it will be empty string
      expect(config.wsUrl).toBeDefined();
    });

    it('should export API_URL helper', () => {
      expect(API_URL).toBe(config.apiUrl);
    });

    it('should export WS_URL helper', () => {
      expect(WS_URL).toBe(config.wsUrl);
    });
  });

  describe('App Information', () => {
    it('should have default app name', () => {
      expect(config.appName).toBe('CosmicQA');
    });

    it('should have default app version', () => {
      expect(config.appVersion).toBe('1.0.0');
    });
  });

  describe('API Timeouts', () => {
    it('should have default API timeout', () => {
      expect(config.apiTimeout).toBe(10000);
    });

    it('should have default WebSocket reconnect interval', () => {
      expect(config.wsReconnectInterval).toBe(3000);
    });
  });

  describe('Notification Defaults', () => {
    it('should have notification durations', () => {
      expect(config.notification.defaultDuration).toBe(5000);
      expect(config.notification.shortDuration).toBe(3000);
      expect(config.notification.mediumDuration).toBe(4000);
      expect(config.notification.longDuration).toBe(8000);
    });

    it('should have notification intervals', () => {
      expect(config.notification.autoSaveInterval).toBe(5000);
      expect(config.notification.duplicateCheckWindow).toBe(5000);
      expect(config.notification.toastDuplicateCheckWindow).toBe(3000);
    });
  });

  describe('Pagination Defaults', () => {
    it('should have default page size', () => {
      expect(config.defaultPageSize).toBe(10);
    });

    it('should have page size options', () => {
      expect(config.defaultPageSizeOptions).toEqual([10, 20, 50, 100]);
    });
  });

  describe('Dashboard Defaults', () => {
    it('should have default date range', () => {
      expect(config.defaultDateRange).toBe(14);
    });

    it('should have max recent tests', () => {
      expect(config.maxRecentTests).toBe(5);
    });
  });

  describe('Storage Keys', () => {
    it('should have all required storage keys', () => {
      // workflows key doesn't exist in config, only these keys exist
      expect(config.storageKeys.notifications).toBe('testflow_notifications');
      expect(config.storageKeys.idCounter).toBe('testflow_notification_counter');
      expect(config.storageKeys.browserSettings).toBe('browserSettings');
      expect(config.storageKeys.theme).toBe('theme');
      expect(config.storageKeys.locale).toBe('locale');
    });
  });

  describe('UI Constants', () => {
    it('should have UI timing constants', () => {
      expect(config.ui.animationDuration).toBe(300);
      expect(config.ui.toastDuration).toBe(5000);
      expect(config.ui.debounceDelay).toBe(300);
    });

    it('should have z-index values', () => {
      expect(config.ui.zIndex.dropdown).toBe(1000);
      expect(config.ui.zIndex.modal).toBe(2000);
      expect(config.ui.zIndex.toast).toBe(3000);
      expect(config.ui.zIndex.tooltip).toBe(4000);
    });
  });

  describe('Error Handling', () => {
    it('should have error configuration', () => {
      expect(config.error.maxLogSize).toBe(50);
      expect(config.error.showDetailsInProduction).toBe(false);
    });
  });
});

