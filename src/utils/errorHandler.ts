/**
 * Frontend error handling utilities
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
  private maxLogSize = 100;

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

    // Add context
    const enrichedError = {
      ...errorInfo,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };

    // Log error
    this.logError(enrichedError);

    // Show user notification
    this.showUserNotification(errorInfo);

    // Report to backend if critical
    if (errorInfo.severity === 'critical' || errorInfo.severity === 'high') {
      this.reportToBackend(enrichedError);
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

    const enrichedError = {
      ...errorInfo,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };

    this.logError(enrichedError);
    this.showUserNotification(errorInfo);

    return errorInfo;
  }

  /**
   * Handle WebSocket errors
   */
  handleWebSocketError(error: any, context: ErrorContext = {}): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: error.code || 13001,
      category: error.category || 'websocket',
      severity: this.mapSeverity(error.severity),
      message: error.message || 'WebSocket hatası',
      details: error.details,
      errorId: error.errorId,
      timestamp: error.timestamp || new Date().toISOString()
    };

    const enrichedError = {
      ...errorInfo,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };

    this.logError(enrichedError);
    this.showUserNotification(errorInfo);

    return errorInfo;
  }

  /**
   * Extract error code from error
   */
  private extractErrorCode(error: Error): number {
    // Check if error has a code property
    if ((error as any).code) {
      return (error as any).code;
    }

    // Map common error types to codes
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorName.includes('network') || errorMessage.includes('fetch')) {
      return 4001;
    }
    if (errorName.includes('timeout')) {
      return 4002;
    }
    if (errorName.includes('validation')) {
      return 1001;
    }
    if (errorName.includes('permission')) {
      return 3001;
    }

    return 9001; // Internal server error
  }

  /**
   * Categorize error
   */
  private categorizeError(error: Error): string {
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorName.includes('network') || errorMessage.includes('fetch')) {
      return 'network';
    }
    if (errorName.includes('validation')) {
      return 'validation';
    }
    if (errorName.includes('permission')) {
      return 'authorization';
    }
    if (errorName.includes('timeout')) {
      return 'timeout';
    }

    return 'system';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    // Critical errors
    if (errorName.includes('critical') || errorMessage.includes('critical')) {
      return 'critical';
    }

    // High severity errors
    if (errorName.includes('network') || errorName.includes('timeout') || 
        errorMessage.includes('connection') || errorMessage.includes('server')) {
      return 'high';
    }

    // Medium severity errors
    if (errorName.includes('validation') || errorName.includes('permission')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get safe error message for user
   */
  private getSafeMessage(error: Error): string {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Return generic messages in production
      const errorName = error.name?.toLowerCase() || '';
      const errorMessage = error.message?.toLowerCase() || '';

      if (errorName.includes('network') || errorMessage.includes('fetch')) {
        return 'Ağ bağlantısında sorun oluştu';
      }
      if (errorName.includes('timeout')) {
        return 'İşlem zaman aşımına uğradı';
      }
      if (errorName.includes('validation')) {
        return 'Geçersiz veri formatı';
      }
      if (errorName.includes('permission')) {
        return 'Bu işlem için yetkiniz yok';
      }

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
  private logError(errorInfo: any): void {
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
   */
  private showUserNotification(errorInfo: ErrorInfo): void {
    // This would integrate with your notification system
    // For now, we'll use a simple alert for critical errors
    if (errorInfo.severity === 'critical') {
      alert(`Kritik Hata: ${errorInfo.message}`);
    }
  }

  /**
   * Report error to backend
   */
  private async reportToBackend(errorInfo: any): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo)
      });
    } catch (error) {
      console.error('Failed to report error to backend:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    this.errorLog.forEach(error => {
      const key = `${error.category}_${error.severity}`;
      stats[key] = (stats[key] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): any[] {
    return this.errorLog.slice(0, limit);
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


