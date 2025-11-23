import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScheduledTests } from '../useScheduledTests';
import { ScheduledTestService } from '@/utils/api';
import { ScheduledTest } from '@/types/test';

// Mock API hooks
const mockUseApiQuery = vi.fn();
const mockUseApiMutation = vi.fn();

vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual('@/utils/api');
  return {
    ...actual,
    useApiQuery: (queryFn: () => Promise<any>, options: any) => {
      return mockUseApiQuery(queryFn, options);
    },
    useApiMutation: (mutationFn: any, options: any) => {
      return mockUseApiMutation(mutationFn, options);
    },
  };
});

describe('useScheduledTests', () => {
  const mockScheduledTests: ScheduledTest[] = [
    {
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
    },
    {
      id: 'schedule-2',
      name: 'Weekly Test',
      description: 'Runs weekly',
      testId: 'test-2',
      schedule: '0 2 * * 1',
      status: 'paused',
      environment: 'staging',
      suite: 'Integration',
      enabled: false,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockUpcomingRuns = [
    {
      scheduleId: 'schedule-1',
      testName: 'Daily Test',
      runTime: new Date('2024-01-15T09:00:00'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseApiQuery.mockReturnValue({
      data: {
        scheduledTests: mockScheduledTests,
        upcomingRuns: mockUpcomingRuns,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseApiMutation.mockReturnValue({
      mutate: vi.fn().mockResolvedValue({}),
      loading: false,
    });
  });

  it('should return scheduled tests data', () => {
    const { result } = renderHook(() => useScheduledTests());
    
    expect(result.current.scheduledTests).toEqual(mockScheduledTests);
    expect(result.current.upcomingRuns).toEqual(mockUpcomingRuns);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should filter scheduled tests by search', () => {
    const { result } = renderHook(() => useScheduledTests());
    
    act(() => {
      result.current.setFilters({
        search: 'Daily',
        status: [],
        environment: [],
        suite: [],
      });
    });

    expect(result.current.filteredTests).toHaveLength(1);
    expect(result.current.filteredTests[0].name).toBe('Daily Test');
  });

  it('should filter by status', () => {
    const { result } = renderHook(() => useScheduledTests());
    
    act(() => {
      result.current.setFilters({
        search: '',
        status: ['active'],
        environment: [],
        suite: [],
      });
    });

    expect(result.current.filteredTests).toHaveLength(1);
    expect(result.current.filteredTests[0].status).toBe('active');
  });

  it('should filter by environment', () => {
    const { result } = renderHook(() => useScheduledTests());
    
    act(() => {
      result.current.setFilters({
        search: '',
        status: [],
        environment: ['production'],
        suite: [],
      });
    });

    expect(result.current.filteredTests).toHaveLength(1);
    expect(result.current.filteredTests[0].environment).toBe('production');
  });

  it('should create schedule', async () => {
    const mockMutate = vi.fn().mockResolvedValue(mockScheduledTests[0]);
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useScheduledTests());
    
    await act(async () => {
      const schedule = await result.current.createSchedule({
        name: 'New Schedule',
        schedule: '0 12 * * *',
      });
      expect(schedule).toBeDefined();
    });
  });

  it('should update schedule', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useScheduledTests());
    
    await act(async () => {
      const success = await result.current.updateSchedule('schedule-1', {
        name: 'Updated Schedule',
      });
      expect(success).toBe(true);
    });
  });

  it('should delete schedule', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useScheduledTests());
    
    await act(async () => {
      const success = await result.current.deleteSchedule('schedule-1');
      expect(success).toBe(true);
    });
  });

  it('should toggle schedule', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useScheduledTests());
    
    await act(async () => {
      const success = await result.current.toggleSchedule('schedule-1');
      expect(success).toBe(true);
    });
  });

  it('should pause schedule', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useScheduledTests());
    
    await act(async () => {
      const success = await result.current.pauseSchedule('schedule-1');
      expect(success).toBe(true);
    });
  });

  it('should resume schedule', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useScheduledTests());
    
    await act(async () => {
      const success = await result.current.resumeSchedule('schedule-1');
      expect(success).toBe(true);
    });
  });
});

