import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduledTestService } from '../scheduledTests';
import { apiClient } from '../../client';
import { ScheduledTest } from '@/types/test';

// Mock apiClient
vi.mock('../../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('ScheduledTestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchScheduledTests', () => {
    it('should fetch scheduled tests from API', async () => {
      const mockData = {
        scheduledTests: [],
        upcomingRuns: [],
      };

      (apiClient.get as any).mockResolvedValueOnce(mockData);

      const result = await ScheduledTestService.fetchScheduledTests();
      expect(apiClient.get).toHaveBeenCalledWith('/api/scheduled-tests');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchScheduledTestById', () => {
    it('should fetch single scheduled test by ID', async () => {
      const mockSchedule: ScheduledTest = {
        id: 'schedule-1',
        name: 'Daily Test',
        description: 'Runs daily',
        testId: 'test-1',
        schedule: '0 9 * * *',
        status: 'active',
        environment: 'production',
        suite: 'E2E',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (apiClient.get as any).mockResolvedValueOnce(mockSchedule);

      const result = await ScheduledTestService.fetchScheduledTestById('schedule-1');
      expect(apiClient.get).toHaveBeenCalledWith('/api/scheduled-tests/schedule-1');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('createScheduledTest', () => {
    it('should create new scheduled test', async () => {
      const newSchedule: Partial<ScheduledTest> = {
        name: 'New Schedule',
        schedule: '0 12 * * *',
        testId: 'test-1',
        status: 'active',
        environment: 'production',
        suite: 'E2E',
        enabled: true,
      };

      const createdSchedule: ScheduledTest = {
        id: 'schedule-new',
        ...newSchedule,
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ScheduledTest;

      (apiClient.post as any).mockResolvedValueOnce(createdSchedule);

      const result = await ScheduledTestService.createScheduledTest(newSchedule as any);
      expect(apiClient.post).toHaveBeenCalledWith('/api/scheduled-tests', newSchedule);
      expect(result).toEqual(createdSchedule);
    });
  });

  describe('updateScheduledTest', () => {
    it('should update existing scheduled test', async () => {
      const updates: Partial<ScheduledTest> = {
        name: 'Updated Schedule',
      };

      const updatedSchedule: ScheduledTest = {
        id: 'schedule-1',
        name: 'Updated Schedule',
        description: '',
        testId: 'test-1',
        schedule: '0 9 * * *',
        status: 'active',
        environment: 'production',
        suite: 'E2E',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      (apiClient.put as any).mockResolvedValueOnce(updatedSchedule);

      const result = await ScheduledTestService.updateScheduledTest('schedule-1', updates);
      expect(apiClient.put).toHaveBeenCalledWith('/api/scheduled-tests/schedule-1', updates);
      expect(result).toEqual(updatedSchedule);
    });
  });

  describe('deleteScheduledTest', () => {
    it('should delete scheduled test', async () => {
      (apiClient.delete as any).mockResolvedValueOnce(undefined);

      await ScheduledTestService.deleteScheduledTest('schedule-1');
      expect(apiClient.delete).toHaveBeenCalledWith('/api/scheduled-tests/schedule-1');
    });
  });

  describe('toggleScheduledTest', () => {
    it('should toggle scheduled test', async () => {
      const toggledSchedule: ScheduledTest = {
        id: 'schedule-1',
        name: 'Test',
        description: '',
        testId: 'test-1',
        schedule: '0 9 * * *',
        status: 'paused',
        environment: 'production',
        suite: 'E2E',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (apiClient.patch as any).mockResolvedValueOnce(toggledSchedule);

      const result = await ScheduledTestService.toggleScheduledTest('schedule-1');
      expect(apiClient.patch).toHaveBeenCalledWith('/api/scheduled-tests/schedule-1/toggle');
      expect(result).toEqual(toggledSchedule);
    });
  });

  describe('pauseScheduledTest', () => {
    it('should pause scheduled test', async () => {
      const pausedSchedule: ScheduledTest = {
        id: 'schedule-1',
        name: 'Test',
        description: '',
        testId: 'test-1',
        schedule: '0 9 * * *',
        status: 'paused',
        environment: 'production',
        suite: 'E2E',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (apiClient.patch as any).mockResolvedValueOnce(pausedSchedule);

      const result = await ScheduledTestService.pauseScheduledTest('schedule-1');
      expect(apiClient.patch).toHaveBeenCalledWith('/api/scheduled-tests/schedule-1/pause');
      expect(result).toEqual(pausedSchedule);
    });
  });

  describe('resumeScheduledTest', () => {
    it('should resume scheduled test', async () => {
      const resumedSchedule: ScheduledTest = {
        id: 'schedule-1',
        name: 'Test',
        description: '',
        testId: 'test-1',
        schedule: '0 9 * * *',
        status: 'active',
        environment: 'production',
        suite: 'E2E',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (apiClient.patch as any).mockResolvedValueOnce(resumedSchedule);

      const result = await ScheduledTestService.resumeScheduledTest('schedule-1');
      expect(apiClient.patch).toHaveBeenCalledWith('/api/scheduled-tests/schedule-1/resume');
      expect(result).toEqual(resumedSchedule);
    });
  });

  describe('getUpcomingRuns', () => {
    it('should get upcoming runs', async () => {
      const mockRuns = [
        {
          scheduleId: 'schedule-1',
          testName: 'Daily Test',
          runTime: new Date('2024-01-15T09:00:00'),
        },
      ];

      (apiClient.get as any).mockResolvedValueOnce(mockRuns);

      const result = await ScheduledTestService.getUpcomingRuns();
      expect(apiClient.get).toHaveBeenCalledWith('/api/scheduled-tests/upcoming');
      expect(result).toEqual(mockRuns);
    });
  });

  describe('bulkDeleteScheduledTests', () => {
    it('should bulk delete scheduled tests', async () => {
      (apiClient.delete as any).mockResolvedValue(undefined);

      const result = await ScheduledTestService.bulkDeleteScheduledTests(['schedule-1', 'schedule-2']);
      expect(result.deletedCount).toBe(2);
    });
  });

  describe('duplicateScheduledTest', () => {
    it('should duplicate scheduled test', async () => {
      const originalSchedule: ScheduledTest = {
        id: 'schedule-1',
        name: 'Original',
        description: 'Original description',
        testId: 'test-1',
        schedule: '0 9 * * *',
        status: 'active',
        environment: 'production',
        suite: 'E2E',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const duplicatedSchedule: ScheduledTest = {
        ...originalSchedule,
        id: 'schedule-2',
        name: 'Original (Kopya)',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      };

      (apiClient.get as any).mockResolvedValueOnce(originalSchedule);
      (apiClient.post as any).mockResolvedValueOnce(duplicatedSchedule);

      const result = await ScheduledTestService.duplicateScheduledTest('schedule-1');
      expect(result.name).toContain('Kopya');
    });
  });
});

