import { apiClient } from '../client';
import { API_ENDPOINTS } from '../types';
import { ExecutionResult, ExecutionStats } from '@/types';

// Execution API Service
export class ExecutionService {
  // Fetch all executions
  static async fetchExecutions(): Promise<ExecutionResult[]> {
    return apiClient.get<ExecutionResult[]>(API_ENDPOINTS.EXECUTIONS);
  }

  // Fetch single execution by ID
  static async fetchExecutionById(id: string): Promise<ExecutionResult> {
    return apiClient.get<ExecutionResult>(`${API_ENDPOINTS.EXECUTIONS}/${id}`);
  }

  // Delete execution
  static async deleteExecution(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.EXECUTIONS}/${id}`);
  }

  // Bulk delete executions
  static async bulkDeleteExecutions(ids: string[]): Promise<{ deletedCount: number }> {
    const deletePromises = ids.map(id => this.deleteExecution(id));
    const results = await Promise.allSettled(deletePromises);
    
    const deletedCount = results.filter(result => result.status === 'fulfilled').length;
    return { deletedCount };
  }

  // Execute workflow
  static async executeWorkflow(workflowData: {
    workflowId: string;
    workflowName: string;
    steps: any[];
    suite: string;
    tags: string[];
    options: {
      enableScreenshots?: boolean;
      enableRecording?: boolean;
      headlessMode?: boolean;
      browserType?: string;
    };
  }): Promise<{ executionId: string }> {
    return apiClient.post<{ executionId: string }>(`${API_ENDPOINTS.EXECUTIONS}/execute`, workflowData);
  }

  // Get execution stats
  static async getExecutionStats(): Promise<ExecutionStats> {
    return apiClient.get<ExecutionStats>(`${API_ENDPOINTS.EXECUTIONS}/stats`);
  }

  // Get execution logs
  static async getExecutionLogs(executionId: string): Promise<string[]> {
    return apiClient.get<string[]>(`${API_ENDPOINTS.EXECUTIONS}/${executionId}/logs`);
  }

  // Get execution screenshots
  static async getExecutionScreenshots(executionId: string): Promise<string[]> {
    return apiClient.get<string[]>(`${API_ENDPOINTS.EXECUTIONS}/${executionId}/screenshots`);
  }

  // Get execution video
  static async getExecutionVideo(executionId: string): Promise<string | null> {
    return apiClient.get<string | null>(`${API_ENDPOINTS.EXECUTIONS}/${executionId}/video`);
  }
}

// Export individual functions for convenience
export const {
  fetchExecutions,
  fetchExecutionById,
  deleteExecution,
  bulkDeleteExecutions,
  executeWorkflow,
  getExecutionStats,
  getExecutionLogs,
  getExecutionScreenshots,
  getExecutionVideo,
} = ExecutionService;
