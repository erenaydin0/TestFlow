import { apiClient } from '../client';
import { API_ENDPOINTS } from '../types';
import { ScheduledTest, UpcomingRun } from '@/types';
import { executeBulkOperation } from '../utils';

// Scheduled Test API Service
export class ScheduledTestService {
  // Fetch all scheduled tests
  static async fetchScheduledTests(): Promise<{
    scheduledTests: ScheduledTest[];
    upcomingRuns: UpcomingRun[];
  }> {
    return apiClient.get<{
      scheduledTests: ScheduledTest[];
      upcomingRuns: UpcomingRun[];
    }>(API_ENDPOINTS.SCHEDULED_TESTS);
  }

  // Fetch single scheduled test by ID
  static async fetchScheduledTestById(id: string): Promise<ScheduledTest> {
    return apiClient.get<ScheduledTest>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}`);
  }

  // Create new scheduled test
  static async createScheduledTest(scheduleData: Omit<ScheduledTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledTest> {
    return apiClient.post<ScheduledTest>(API_ENDPOINTS.SCHEDULED_TESTS, scheduleData);
  }

  // Update existing scheduled test
  static async updateScheduledTest(id: string, scheduleData: Partial<ScheduledTest>): Promise<ScheduledTest> {
    return apiClient.put<ScheduledTest>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}`, scheduleData);
  }

  // Delete scheduled test
  static async deleteScheduledTest(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}`);
  }

  // Toggle scheduled test (active/paused)
  static async toggleScheduledTest(id: string): Promise<ScheduledTest> {
    return apiClient.patch<ScheduledTest>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}/toggle`);
  }

  // Pause scheduled test
  static async pauseScheduledTest(id: string): Promise<ScheduledTest> {
    return apiClient.patch<ScheduledTest>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}/pause`);
  }

  // Resume scheduled test
  static async resumeScheduledTest(id: string): Promise<ScheduledTest> {
    return apiClient.patch<ScheduledTest>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}/resume`);
  }

  // Get upcoming runs
  static async getUpcomingRuns(): Promise<UpcomingRun[]> {
    return apiClient.get<UpcomingRun[]>(`${API_ENDPOINTS.SCHEDULED_TESTS}/upcoming`);
  }

  // Get scheduled test history
  static async getScheduledTestHistory(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`${API_ENDPOINTS.SCHEDULED_TESTS}/${id}/history`);
  }

  // Bulk delete scheduled tests
  static async bulkDeleteScheduledTests(ids: string[]): Promise<{ deletedCount: number }> {
    return executeBulkOperation(ids, (id) => this.deleteScheduledTest(id), 'deletedCount');
  }

  // Duplicate scheduled test
  static async duplicateScheduledTest(id: string, newName?: string): Promise<ScheduledTest> {
    const originalSchedule = await this.fetchScheduledTestById(id);
    const duplicatedSchedule = {
      ...originalSchedule,
      id: undefined, // Backend will generate new ID
      name: newName || `${originalSchedule.name} (Kopya)`,
      createdAt: undefined,
      updatedAt: undefined,
    };
    
    return this.createScheduledTest(duplicatedSchedule);
  }
}

// Export individual functions for convenience
export const {
  fetchScheduledTests,
  fetchScheduledTestById,
  createScheduledTest,
  updateScheduledTest,
  deleteScheduledTest,
  toggleScheduledTest,
  pauseScheduledTest,
  resumeScheduledTest,
  getUpcomingRuns,
  getScheduledTestHistory,
  bulkDeleteScheduledTests,
  duplicateScheduledTest,
} = ScheduledTestService;
