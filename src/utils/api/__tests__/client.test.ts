import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '../client';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient = new ApiClient({
      baseURL: 'http://localhost:3001',
      timeout: 10000,
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const client = new ApiClient({
        baseURL: 'http://test.com',
      });
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should use custom timeout', () => {
      const client = new ApiClient({
        baseURL: 'http://test.com',
        timeout: 5000,
      });
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should use custom headers', () => {
      const client = new ApiClient({
        baseURL: 'http://test.com',
        defaultHeaders: {
          'Authorization': 'Bearer token',
        },
      });
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.get('/api/test');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^http:\/\/localhost:3001\/api\/test\?t=\d+$/),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle empty response (204)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await apiClient.get('/api/test');
      expect(result).toBeNull();
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const requestData = { name: 'Test', value: 42 };
      const responseData = { id: 1, ...requestData };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.post('/api/test', requestData);
      expect(result).toEqual(responseData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const requestData = { name: 'Updated' };
      const responseData = { id: 1, ...requestData };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.put('/api/test/1', requestData);
      expect(result).toEqual(responseData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await apiClient.delete('/api/test/1');
      expect(result).toBeNull();
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const requestData = { name: 'Patched' };
      const responseData = { id: 1, ...requestData };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.patch('/api/test/1', requestData);
      expect(result).toEqual(responseData);
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError for non-ok responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found', code: 'NOT_FOUND' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(apiClient.get('/api/test')).rejects.toThrow(ApiError);
    });

    it('should handle timeout errors', async () => {
      const client = new ApiClient({
        baseURL: 'http://localhost:3001',
        timeout: 1, // Very short timeout
      });

      (global.fetch as any).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
      );

      await expect(client.get('/api/test')).rejects.toThrow(ApiError);
    });

    it('should handle JSON parse errors in error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/api/test')).rejects.toThrow(ApiError);
    });
  });

  describe('Request configuration', () => {
    it('should use custom headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.get('/api/test', {
        headers: {
          'Authorization': 'Bearer token',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
          }),
        })
      );
    });

    it('should use custom timeout', async () => {
      const client = new ApiClient({
        baseURL: 'http://localhost:3001',
        timeout: 5000,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await client.get('/api/test', { timeout: 2000 });
      // Timeout should be applied (tested via AbortController)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Response types', () => {
    it('should handle text responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Plain text response',
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      const result = await apiClient.get('/api/test');
      expect(result).toBe('Plain text response');
    });
  });
});

describe('ApiError', () => {
  it('should create error with message', () => {
    const error = new ApiError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ApiError');
  });

  it('should create error with status code', () => {
    const error = new ApiError('Not found', 404);
    expect(error.status).toBe(404);
  });

  it('should create error with code', () => {
    const error = new ApiError('Error', 500, 'INTERNAL_ERROR');
    expect(error.code).toBe('INTERNAL_ERROR');
  });
});

