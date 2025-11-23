'use client';

/**
 * Basitleştirilmiş frontend error handling utilities
 */

export interface ErrorInfo {
  code: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  errorId?: string;
  timestamp: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class FrontendErrorHandler {
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 50; // Reduced from 100

  /**
   * Handle and log frontend errors
   */
  handleError(error: Error, context: ErrorContext = {}): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: this.extractErrorCode(error),
      category: this.categorizeError(error),
      severity: this.determineSeverity(error),
      message: this.getSafeMessage(error),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorId: this.generateErrorId(),
      timestamp: new Date().toISOString()
    };

    // Log error
    this.logError(errorInfo);

    // Show user notification for critical errors
    if (errorInfo.severity === 'critical') {
      this.showUserNotification(errorInfo);
    }

    return errorInfo;
  }

  /**
   * Handle API errors
   */
  handleApiError(response: any, context: ErrorContext = {}): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: response.code || 500,
      category: response.category || 'api',
      severity: this.mapSeverity(response.severity),
      message: response.error || 'API hatası',
      details: response.details,
      errorId: response.errorId,
      timestamp: response.timestamp || new Date().toISOString()
    };

    this.logError(errorInfo);
    this.showUserNotification(errorInfo);

    return errorInfo;
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: Error): number {
    if ((error as any).code) {
      return (error as any).code;
    }

    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorName.includes('network') || errorMessage.includes('fetch')) return 4001;
    if (errorName.includes('timeout')) return 4002;
    if (errorName.includes('validation')) return 1001;
    if (errorName.includes('permission')) return 3001;

    return 9001; // Internal server error
  }

  /**
   * Categorize error
   */
  private categorizeError(error: Error): string {
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorName.includes('network') || errorMessage.includes('fetch')) return 'network';
    if (errorName.includes('validation')) return 'validation';
    if (errorName.includes('permission')) return 'authorization';
    if (errorName.includes('timeout')) return 'timeout';

    return 'system';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorName.includes('critical') || errorMessage.includes('critical')) return 'critical';
    if (errorName.includes('network') || errorName.includes('timeout') || 
        errorMessage.includes('connection') || errorMessage.includes('server')) return 'high';
    if (errorName.includes('validation') || errorName.includes('permission')) return 'medium';

    return 'low';
  }

  /**
   * Get safe error message for user
   */
  private getSafeMessage(error: Error): string {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      const errorName = error.name?.toLowerCase() || '';
      const errorMessage = error.message?.toLowerCase() || '';

      if (errorName.includes('network') || errorMessage.includes('fetch')) return 'Ağ bağlantısında sorun oluştu';
      if (errorName.includes('timeout')) return 'İşlem zaman aşımına uğradı';
      if (errorName.includes('validation')) return 'Geçersiz veri formatı';
      if (errorName.includes('permission')) return 'Bu işlem için yetkiniz yok';

      return 'Beklenmeyen bir hata oluştu';
    }

    return error.message || 'Bilinmeyen hata';
  }

  /**
   * Map severity from string
   */
  private mapSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      case 'critical': return 'critical';
      default: return 'medium';
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `fe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error to console and memory
   */
  private logError(errorInfo: ErrorInfo): void {
    // Add to memory log
    this.errorLog.unshift(errorInfo);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }

    // Console logging based on severity
    const logLevel = {
      'critical': 'error',
      'high': 'error',
      'medium': 'warn',
      'low': 'info'
    }[errorInfo.severity] || 'info';

    const message = `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`;
    
    if (logLevel === 'error') {
      console.error(message, errorInfo);
    } else if (logLevel === 'warn') {
      console.warn(message, errorInfo);
    } else {
      console.log(message, errorInfo);
    }
  }

  /**
   * Show user notification
   * Note: This method is called but actual notification should be handled
   * by the component using the error handler hook which has access to toast notifications
   */
  private showUserNotification(errorInfo: ErrorInfo): void {
    // Alert removed - use toast notifications via useErrorHandler hook instead
    // Critical errors will be shown via toast in components that use useErrorHandler
    if (errorInfo.severity === 'critical') {
      console.error('Critical error:', errorInfo);
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Handle WebSocket errors
   */
  handleWebSocketError(error: any, context: ErrorContext = {}): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: 5001,
      category: 'websocket',
      severity: 'high',
      message: error.message || 'WebSocket bağlantı hatası',
      details: error.details,
      errorId: this.generateErrorId(),
      timestamp: new Date().toISOString()
    };

    this.logError(errorInfo);
    this.showUserNotification(errorInfo);

    return errorInfo;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.errorLog.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      bySeverity,
      byCategory
    };
  }
}

// Create singleton instance
export const frontendErrorHandler = new FrontendErrorHandler();

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    frontendErrorHandler.handleError(event.error, {
      component: 'global',
      action: 'unhandled_error'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    frontendErrorHandler.handleError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      {
        component: 'global',
        action: 'unhandled_promise_rejection'
      }
    );
  });
}

export default frontendErrorHandler;

// ============================================================================
// ERROR HANDLER HOOK
// ============================================================================

import { useCallback, useRef } from 'react';

export interface UseErrorHandlerOptions {
  component?: string;
  onError?: (error: Error, errorInfo: any) => void;
  fallbackMessage?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { component = 'unknown', onError, fallbackMessage } = options;
  const errorCountRef = useRef(0);

  const handleError = useCallback((error: Error, context: ErrorContext = {}) => {
    errorCountRef.current += 1;
    
    const errorContext: ErrorContext = {
      ...context,
      component,
      sessionId: sessionStorage.getItem('sessionId') || undefined,
      userId: localStorage.getItem('userId') || undefined
    };

    const errorInfo = frontendErrorHandler.handleError(error, errorContext);
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    return errorInfo;
  }, [component, onError]);

  const handleApiError = useCallback((response: any, context: ErrorContext = {}) => {
    const errorContext: ErrorContext = {
      ...context,
      component,
      sessionId: sessionStorage.getItem('sessionId') || undefined,
      userId: localStorage.getItem('userId') || undefined
    };

    const errorInfo = frontendErrorHandler.handleApiError(response, errorContext);
    
    if (onError) {
      onError(new Error(response.error || 'API Error'), errorInfo);
    }

    return errorInfo;
  }, [component, onError]);

  const handleWebSocketError = useCallback((error: any, context: ErrorContext = {}) => {
    const errorContext: ErrorContext = {
      ...context,
      component,
      sessionId: sessionStorage.getItem('sessionId') || undefined,
      userId: localStorage.getItem('userId') || undefined
    };

    const errorInfo = frontendErrorHandler.handleWebSocketError(error, errorContext);
    
    if (onError) {
      onError(new Error(error.message || 'WebSocket Error'), errorInfo);
    }

    return errorInfo;
  }, [component, onError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError]);

  const getErrorStats = useCallback(() => {
    return frontendErrorHandler.getErrorStats();
  }, []);

  const getRecentErrors = useCallback((limit?: number) => {
    return frontendErrorHandler.getRecentErrors(limit);
  }, []);

  const clearErrorLog = useCallback(() => {
    frontendErrorHandler.clearErrorLog();
  }, []);

  return {
    handleError,
    handleApiError,
    handleWebSocketError,
    handleAsyncError,
    getErrorStats,
    getRecentErrors,
    clearErrorLog,
    errorCount: errorCountRef.current
  };
}