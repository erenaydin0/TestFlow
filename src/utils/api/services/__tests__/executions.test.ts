import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionService } from '../executions';
import { apiClient } from '../../client';
import { ExecutionResult } from '@/types';

// Mock apiClient
vi.mock('../../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ExecutionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchExecutions', () => {
    it('should fetch executions from API', async () => {
      const mockExecutions: ExecutionResult[] = [
        {
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test',
          status: 'completed',
          startTime: new Date(),
          progress: 100,
          options: {
            enableScreenshots: false,
            enableRecording: false,
            headlessMode: true,
            browserType: 'chromium',
          },
          steps: [],
          screenshots: [],
          logs: [],
        },
      ];

      (apiClient.get as any).mockResolvedValueOnce(mockExecutions);

      const result = await ExecutionService.fetchExecutions();
      expect(apiClient.get).toHaveBeenCalledWith('/api/executions');
      expect(result).toEqual(mockExecutions);
    });
  });

  describe('fetchExecutionById', () => {
    it('should fetch single execution by ID', async () => {
      const mockExecution: ExecutionResult = {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Test',
        status: 'completed',
        startTime: new Date(),
        progress: 100,
        options: {
          enableScreenshots: false,
          enableRecording: false,
          headlessMode: true,
          browserType: 'chromium',
        },
        steps: [],
        screenshots: [],
        logs: [],
      };

      (apiClient.get as any).mockResolvedValueOnce(mockExecution);

      const result = await ExecutionService.fetchExecutionById('exec-1');
      expect(apiClient.get).toHaveBeenCalledWith('/api/executions/exec-1');
      expect(result).toEqual(mockExecution);
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow', async () => {
      const workflowData = {
        workflowId: 'workflow-1',
        workflowName: 'Test',
        steps: [],
        suite: 'E2E',
        tags: ['smoke'],
        options: {
          enableScreenshots: false,
          enableRecording: false,
          headlessMode: true,
          browserType: 'chromium' as const,
        },
      };

      const mockResponse = {
        executionId: 'exec-1',
      };

      (apiClient.post as any).mockResolvedValueOnce(mockResponse);

      const result = await ExecutionService.executeWorkflow(workflowData);
      expect(apiClient.post).toHaveBeenCalledWith('/api/executions/execute', workflowData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteExecution', () => {
    it('should delete execution', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({ success: true });

      const result = await ExecutionService.deleteExecution('exec-1');
      expect(apiClient.delete).toHaveBeenCalledWith('/api/executions/exec-1');
      expect(result).toEqual({ success: true });
    });
  });
});

