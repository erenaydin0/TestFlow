import { API_URL } from '@/utils/utils';
import { ApiResponse, RequestConfig, HttpMethod, ApiClientConfig } from './types';

// Custom ApiError class
export class ApiError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  private async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: config?.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(errorData.message, response.status, errorData.code);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return null as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleRequestError(error);
    }
  }

  private async parseErrorResponse(response: Response): Promise<{ message: string; code?: string }> {
    try {
      const errorData = await response.json();
      return {
        message: errorData.message || errorData.error || `HTTP ${response.status}`,
        code: errorData.code,
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }

  private handleRequestError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiError('Request timeout', 408, 'TIMEOUT');
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ApiError('Network error - please check your connection', 0, 'NETWORK_ERROR');
    }

    return new ApiError(
      error.message || 'An unexpected error occurred',
      error.status || 500,
      error.code || 'UNKNOWN_ERROR'
    );
  }

  // HTTP Methods
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseURL: API_URL,
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});

// Export default instance
export default apiClient;
