import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useReports from '../useReports';
import { ExecutionResult } from '@/types';

// Mock dependencies
const mockUseExecutions = vi.fn();
const mockUseSorting = vi.fn();
const mockUseApiMutation = vi.fn();

vi.mock('./useExecutions', () => ({
  default: (options: any) => mockUseExecutions(options),
}));

vi.mock('./useSorting', () => ({
  default: (options: any) => mockUseSorting(options),
}));

vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual('@/utils/api');
  return {
    ...actual,
    useApiMutation: (mutationFn: any, options: any) => {
      return mockUseApiMutation(mutationFn, options);
    },
  };
});

describe('useReports', () => {
  const mockExecutions: ExecutionResult[] = [
    {
      id: 'exec-1',
      workflowId: 'workflow-1',
      workflowName: 'Test 1',
      status: 'completed',
      startTime: new Date('2024-01-01'),
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
      duration: 5000,
      successRate: 100,
      suite: 'E2E',
      tags: ['smoke'],
    },
    {
      id: 'exec-2',
      workflowId: 'workflow-2',
      workflowName: 'Test 2',
      status: 'failed',
      startTime: new Date('2024-01-02'),
      progress: 50,
      options: {
        enableScreenshots: false,
        enableRecording: false,
        headlessMode: true,
        browserType: 'firefox',
      },
      steps: [],
      screenshots: [],
      logs: [],
      duration: 3000,
      suite: 'Integration',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseExecutions.mockReturnValue({
      executions: mockExecutions,
      loading: false,
      error: null,
      stats: {
        totalExecutions: 2,
        completedExecutions: 1,
        failedExecutions: 1,
        avgDuration: 4000,
        successRate: 50,
      },
      refresh: vi.fn(),
    });

    mockUseSorting.mockReturnValue({
      sortedData: mockExecutions,
      sortField: 'startTime',
      sortOrder: 'desc',
      handleSort: vi.fn(),
    });

    mockUseApiMutation.mockReturnValue({
      mutate: vi.fn().mockResolvedValue({}),
      loading: false,
    });
  });

  it('should return executions data', () => {
    const { result } = renderHook(() => useReports());
    
    expect(result.current.executions).toEqual(mockExecutions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should filter executions', () => {
    const { result } = renderHook(() => useReports());
    
    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'Test 1',
      });
    });

    expect(result.current.filteredExecutions).toBeDefined();
  });

  it('should detect active filters', () => {
    const { result } = renderHook(() => useReports());
    
    expect(result.current.hasActiveFilters).toBe(false);
    
    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'test',
      });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should clear filters', () => {
    const { result } = renderHook(() => useReports());
    
    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'test',
        suite: ['E2E'],
      });
      result.current.clearFilters();
    });

    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.suite).toEqual([]);
  });

  it('should handle sort', () => {
    const { result } = renderHook(() => useReports());
    const mockHandleSort = vi.fn();
    mockUseSorting.mockReturnValue({
      sortedData: mockExecutions,
      sortField: 'startTime',
      sortOrder: 'desc',
      handleSort: mockHandleSort,
    });

    act(() => {
      result.current.handleSort('workflowName');
    });

    expect(mockHandleSort).toHaveBeenCalledWith('workflowName');
  });

  it('should calculate filtered stats', () => {
    const { result } = renderHook(() => useReports());
    
    expect(result.current.filteredStats).toBeDefined();
    expect(result.current.filteredStats.totalExecutions).toBe(2);
  });

  it('should manage selected executions', () => {
    const { result } = renderHook(() => useReports());
    
    act(() => {
      result.current.setSelectedExecutions(new Set(['exec-1']));
    });

    expect(result.current.selectedExecutions.has('exec-1')).toBe(true);
  });
});

