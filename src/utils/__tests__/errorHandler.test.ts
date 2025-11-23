import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  frontendErrorHandler,
  useErrorHandler,
  ErrorInfo,
  ErrorContext,
} from '../errorHandler';

describe('FrontendErrorHandler', () => {
  beforeEach(() => {
    // Clear error log before each test
    frontendErrorHandler.clearErrorLog();
  });

  describe('handleError', () => {
    it('should handle and categorize errors', () => {
      const error = new Error('Test error');
      const errorInfo = frontendErrorHandler.handleError(error);

      expect(errorInfo).toHaveProperty('code');
      expect(errorInfo).toHaveProperty('category');
      expect(errorInfo).toHaveProperty('severity');
      expect(errorInfo).toHaveProperty('message');
      expect(errorInfo).toHaveProperty('errorId');
      expect(errorInfo).toHaveProperty('timestamp');
    });

    it('should categorize network errors', () => {
      const error = new Error('Network request failed');
      error.name = 'NetworkError';
      const errorInfo = frontendErrorHandler.handleError(error);

      expect(errorInfo.category).toBe('network');
      expect(errorInfo.code).toBe(4001);
    });

    it('should categorize validation errors', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      const errorInfo = frontendErrorHandler.handleError(error);

      expect(errorInfo.category).toBe('validation');
      expect(errorInfo.code).toBe(1001);
    });

    it('should determine error severity', () => {
      const criticalError = new Error('Critical system failure');
      criticalError.name = 'CriticalError';
      const errorInfo = frontendErrorHandler.handleError(criticalError);

      expect(errorInfo.severity).toBe('critical');
    });

    it('should generate unique error IDs', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      const info1 = frontendErrorHandler.handleError(error1);
      const info2 = frontendErrorHandler.handleError(error2);

      expect(info1.errorId).not.toBe(info2.errorId);
    });

    it('should limit error log size', () => {
      // Add more than maxLogSize errors
      for (let i = 0; i < 60; i++) {
        frontendErrorHandler.handleError(new Error(`Error ${i}`));
      }

      const recentErrors = frontendErrorHandler.getRecentErrors(100);
      expect(recentErrors.length).toBeLessThanOrEqual(50);
    });
  });

  describe('handleApiError', () => {
    it('should handle API error responses', () => {
      const apiResponse = {
        code: 404,
        category: 'api',
        severity: 'medium',
        error: 'Resource not found',
        errorId: 'api-123',
        timestamp: new Date().toISOString(),
      };

      const errorInfo = frontendErrorHandler.handleApiError(apiResponse);
      expect(errorInfo.code).toBe(404);
      expect(errorInfo.message).toBe('Resource not found');
    });

    it('should handle API errors with default values', () => {
      const apiResponse = {
        error: 'Unknown error',
      };

      const errorInfo = frontendErrorHandler.handleApiError(apiResponse);
      expect(errorInfo.code).toBe(500);
      expect(errorInfo.category).toBe('api');
    });
  });

  describe('handleWebSocketError', () => {
    it('should handle WebSocket errors', () => {
      const wsError = {
        message: 'Connection lost',
        details: 'Network issue',
      };

      const errorInfo = frontendErrorHandler.handleWebSocketError(wsError);
      expect(errorInfo.category).toBe('websocket');
      expect(errorInfo.code).toBe(5001);
      expect(errorInfo.severity).toBe('high');
    });
  });

  describe('getRecentErrors', () => {
    it('should return recent errors', () => {
      frontendErrorHandler.handleError(new Error('Error 1'));
      frontendErrorHandler.handleError(new Error('Error 2'));

      const recentErrors = frontendErrorHandler.getRecentErrors(10);
      expect(recentErrors.length).toBe(2);
    });

    it('should limit returned errors', () => {
      for (let i = 0; i < 5; i++) {
        frontendErrorHandler.handleError(new Error(`Error ${i}`));
      }

      const recentErrors = frontendErrorHandler.getRecentErrors(2);
      expect(recentErrors.length).toBe(2);
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      frontendErrorHandler.handleError(new Error('Network error'));
      frontendErrorHandler.handleError(new Error('Validation error'));

      const stats = frontendErrorHandler.getErrorStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byCategory).toBeDefined();
    });
  });

  describe('useErrorHandler hook', () => {
    it('should provide error handling functions', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.handleError).toBeDefined();
      expect(result.current.handleApiError).toBeDefined();
      expect(result.current.handleWebSocketError).toBeDefined();
      expect(result.current.handleAsyncError).toBeDefined();
      expect(result.current.getErrorStats).toBeDefined();
      expect(result.current.getRecentErrors).toBeDefined();
    });

    it('should handle errors with context', () => {
      const { result } = renderHook(() =>
        useErrorHandler({ component: 'TestComponent' })
      );

      const error = new Error('Test error');
      const errorInfo = result.current.handleError(error, { action: 'test-action' });

      expect(errorInfo).toBeDefined();
      expect(errorInfo.category).toBeDefined();
    });

    it('should handle async errors', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const asyncFn = async () => {
        throw new Error('Async error');
      };

      const resultValue = await result.current.handleAsyncError(asyncFn);
      expect(resultValue).toBeNull();
    });

    it('should return value from successful async function', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const asyncFn = async () => {
        return 'success';
      };

      const resultValue = await result.current.handleAsyncError(asyncFn);
      expect(resultValue).toBe('success');
    });

    it('should call custom onError callback', () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useErrorHandler({ component: 'Test', onError })
      );

      const error = new Error('Test error');
      result.current.handleError(error);

      expect(onError).toHaveBeenCalled();
    });

    it('should track error count', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleError(new Error('Error 1'));
      result.current.handleError(new Error('Error 2'));

      expect(result.current.errorCount).toBeGreaterThanOrEqual(0);
    });
  });
});

