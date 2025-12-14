import { apiClient } from '../client';
import { API_ENDPOINTS } from '../types';
import { Test } from '@/types';
import { executeBulkOperation } from '../utils';

// Test API Service
export class TestService {
  // Fetch all tests
  static async fetchTests(): Promise<Test[]> {
    return apiClient.get<Test[]>(API_ENDPOINTS.TESTS);
  }

  // Fetch single test by ID
  static async fetchTestById(id: string): Promise<Test> {
    return apiClient.get<Test>(`${API_ENDPOINTS.TESTS}/${id}`);
  }

  // Create new test
  static async createTest(testData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
    return apiClient.post<Test>(API_ENDPOINTS.TESTS, testData);
  }

  // Update existing test
  static async updateTest(id: string, testData: Partial<Test>): Promise<Test> {
    return apiClient.put<Test>(`${API_ENDPOINTS.TESTS}/${id}`, testData);
  }

  // Delete test
  static async deleteTest(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.TESTS}/${id}`);
  }

  // Bulk delete tests
  static async bulkDeleteTests(ids: string[]): Promise<{ deletedCount: number }> {
    return executeBulkOperation(ids, (id) => this.deleteTest(id), 'deletedCount');
  }

  // Duplicate test
  static async duplicateTest(id: string, newName?: string): Promise<Test> {
    const originalTest = await this.fetchTestById(id);
    const duplicatedTest = {
      ...originalTest,
      id: undefined, // Backend will generate new ID
      name: newName || `${originalTest.name} (Kopya)`,
      createdAt: undefined,
      updatedAt: undefined,
    };
    
    return this.createTest(duplicatedTest);
  }

  // Bulk duplicate tests
  static async bulkDuplicateTests(ids: string[]): Promise<{ duplicatedCount: number }> {
    return executeBulkOperation(ids, (id) => this.duplicateTest(id), 'duplicatedCount');
  }

  // Execute test
  static async executeTest(testId: string, options?: {
    enableScreenshots?: boolean;
    enableRecording?: boolean;
    headlessMode?: boolean;
    browserType?: string;
  }): Promise<{ executionId: string }> {
    return apiClient.post<{ executionId: string }>(`${API_ENDPOINTS.TESTS}/${testId}/execute`, options);
  }
}

// Export individual functions for convenience
export const {
  fetchTests,
  fetchTestById,
  createTest,
  updateTest,
  deleteTest,
  bulkDeleteTests,
  duplicateTest,
  bulkDuplicateTests,
  executeTest,
} = TestService;
