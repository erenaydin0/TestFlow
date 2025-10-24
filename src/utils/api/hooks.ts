'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseApiQueryReturn, UseApiMutationReturn } from './types';
import { ApiError } from './client';

// Generic API Query Hook
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
): UseApiQueryReturn<T> {
  const { enabled = true, refetchOnMount = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const executeQuery = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    // Force refetch even if enabled is false
    try {
      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, onSuccess, onError]);

  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [executeQuery, enabled]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Generic API Mutation Hook
export function useApiMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  options: {
    onSuccess?: (data: T, params: P) => void | Promise<void>;
    onError?: (error: string, params: P) => void;
    onMutate?: (params: P) => void;
  } = {}
): UseApiMutationReturn<T, P> {
  const { onSuccess, onError, onMutate } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      onMutate?.(params);
      
      const result = await mutationFn(params);
      
      if (mountedRef.current) {
        setData(result);
        await onSuccess?.(result, params);
      }
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(errorMessage, params);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mutationFn, onSuccess, onError, onMutate]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

// Hook for managing multiple API calls with loading states
export function useApiQueries<T extends Record<string, () => Promise<any>>>(
  queries: T,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) {
  const { enabled = true, refetchOnMount = true } = options;
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  const [data, setData] = useState<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }>({} as any);
  const mountedRef = useRef(true);

  const executeQueries = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setErrors({} as Record<keyof T, string | null>);
      
      const results = await Promise.allSettled(
        Object.entries(queries).map(async ([key, queryFn]) => {
          try {
            const result = await queryFn();
            return { key, result, error: null };
          } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred';
            return { key, result: null, error: errorMessage };
          }
        })
      );
      
      if (mountedRef.current) {
        const newData = {} as any;
        const newErrors = {} as any;
        
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { key, result: data, error } = result.value;
            newData[key] = data;
            newErrors[key] = error;
          }
        });
        
        setData(newData);
        setErrors(newErrors);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [queries, enabled]);

  const refetch = useCallback(async () => {
    await executeQueries();
  }, [executeQueries]);

  useEffect(() => {
    if (refetchOnMount && enabled) {
      executeQueries();
    }
  }, [executeQueries, refetchOnMount, enabled]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    errors,
    refetch,
  };
}

// Hook for optimistic updates
export function useOptimisticMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  optimisticUpdateFn: (params: P) => T,
  rollbackFn: (params: P) => void,
  options: {
    onSuccess?: (data: T, params: P) => void;
    onError?: (error: string, params: P) => void;
  } = {}
) {
  const { onSuccess, onError } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply optimistic update
      const optimisticData = optimisticUpdateFn(params);
      
      const result = await mutationFn(params);
      
      if (mountedRef.current) {
        onSuccess?.(result, params);
      }
      
      return result;
    } catch (err) {
      if (mountedRef.current) {
        // Rollback optimistic update
        rollbackFn(params);
        
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(errorMessage, params);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mutationFn, optimisticUpdateFn, rollbackFn, onSuccess, onError]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    loading,
    error,
    mutate,
  };
}
