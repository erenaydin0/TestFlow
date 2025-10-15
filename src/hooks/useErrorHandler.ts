/**
 * Error handling hook for React components
 */

import { useCallback, useRef } from 'react';
import frontendErrorHandler, { ErrorContext } from '@/utils/errorHandler';

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

export default useErrorHandler;


