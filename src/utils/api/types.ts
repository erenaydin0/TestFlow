// API Response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Client configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

// Hook return types
export interface UseApiQueryReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseApiMutationReturn<T, P = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (params: P) => Promise<T | null>;
  reset: () => void;
}

// Common API endpoints
export const API_ENDPOINTS = {
  TESTS: '/api/tests',
  EXECUTIONS: '/api/executions',
  SCHEDULED_TESTS: '/api/scheduled-tests',
  HEALTH: '/api/health',
} as const;
