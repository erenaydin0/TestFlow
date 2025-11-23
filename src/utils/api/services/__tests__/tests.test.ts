import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestService } from '../tests';
import { apiClient } from '../../client';
import { Test } from '@/types';

// Mock apiClient
vi.mock('../../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTests', () => {
    it('should fetch tests from API', async () => {
      const mockTests: Test[] = [
        {
          id: 'test-1',
          name: 'Test 1',
          workflow: [],
        },
      ];

      (apiClient.get as any).mockResolvedValueOnce(mockTests);

      const result = await TestService.fetchTests();
      expect(apiClient.get).toHaveBeenCalledWith('/api/tests');
      expect(result).toEqual(mockTests);
    });

    it('should handle API errors', async () => {
      (apiClient.get as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(TestService.fetchTests()).rejects.toThrow();
    });
  });

  describe('fetchTestById', () => {
    it('should fetch single test by ID', async () => {
      const mockTest: Test = {
        id: 'test-1',
        name: 'Test 1',
        workflow: [],
      };

      (apiClient.get as any).mockResolvedValueOnce(mockTest);

      const result = await TestService.fetchTestById('test-1');
      expect(apiClient.get).toHaveBeenCalledWith('/api/tests/test-1');
      expect(result).toEqual(mockTest);
    });
  });

  describe('createTest', () => {
    it('should create new test', async () => {
      const newTest: Partial<Test> = {
        name: 'New Test',
        workflow: [],
      };

      const createdTest: Test = {
        id: 'test-new',
        ...newTest,
        workflow: [],
      } as Test;

      (apiClient.post as any).mockResolvedValueOnce(createdTest);

      const result = await TestService.createTest(newTest);
      expect(apiClient.post).toHaveBeenCalledWith('/api/tests', newTest);
      expect(result).toEqual(createdTest);
    });
  });

  describe('updateTest', () => {
    it('should update existing test', async () => {
      const updates: Partial<Test> = {
        name: 'Updated Test',
      };

      const updatedTest: Test = {
        id: 'test-1',
        name: 'Updated Test',
        workflow: [],
      };

      (apiClient.put as any).mockResolvedValueOnce(updatedTest);

      const result = await TestService.updateTest('test-1', updates);
      expect(apiClient.put).toHaveBeenCalledWith('/api/tests/test-1', updates);
      expect(result).toEqual(updatedTest);
    });
  });

  describe('deleteTest', () => {
    it('should delete test', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({ success: true });

      const result = await TestService.deleteTest('test-1');
      expect(apiClient.delete).toHaveBeenCalledWith('/api/tests/test-1');
      expect(result).toEqual({ success: true });
    });
  });
});

