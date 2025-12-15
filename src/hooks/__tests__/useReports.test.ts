import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useReports from '../useReports';
import { ExecutionResult } from '@/types';

// Mock dependencies
const mockUseExecutions = vi.fn();
const mockUseSorting = vi.fn();
const mockUseApiMutation = vi.fn();
const mockUseApiQuery = vi.fn();

// Mock API utilities FIRST (before useExecutions which depends on it)
vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual('@/utils/api');
  return {
    ...actual,
    useApiQuery: (queryFn: any, options: any) => mockUseApiQuery(queryFn, options),
    useApiMutation: (mutationFn: any, options: any) => {
      return mockUseApiMutation(mutationFn, options);
    },
  };
});

// Mock useExecutions - IMPORTANT: This must be mocked AFTER api mock
// because useExecutions internally uses useApiQuery
vi.mock('./useExecutions', () => ({
  default: (options: any) => mockUseExecutions(options),
}));

vi.mock('./useSorting', () => ({
  default: (options: any) => mockUseSorting(options),
}));

vi.mock('@/utils/fileUtils', () => ({
  filterExecutions: (executions: ExecutionResult[], filters: any) => {
    // Simple filter implementation for tests
    if (!filters.search) return executions;
    return executions.filter(e => 
      e.workflowName.toLowerCase().includes(filters.search.toLowerCase())
    );
  },
  getUniqueFilterOptions: () => ({
    suites: [],
    tags: [],
    browserTypes: [],
  }),
}));

describe('useReports', () => {
  // Create a shared mock handleSort function that can be tracked
  let sharedMockHandleSort: ReturnType<typeof vi.fn>;

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

  // Create a stable mock return object that can be reused
  let mockSortingReturn: ReturnType<typeof mockUseSorting>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a new mock function for each test
    sharedMockHandleSort = vi.fn();
    
    // Create a stable return object
    mockSortingReturn = {
      sortedData: mockExecutions,
      sortField: 'startTime' as const,
      sortOrder: 'desc' as const,
      handleSort: sharedMockHandleSort,
    };
    
    // Setup default mock return values - use mockImplementation to ensure it's called
    mockUseExecutions.mockImplementation(() => ({
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
      fetchExecutions: vi.fn(),
    }));

    // Always return the same object reference so handleSort is the same function
    // Use mockReturnValue to ensure the same reference is returned
    mockUseSorting.mockReturnValue(mockSortingReturn);

    mockUseApiMutation.mockReturnValue({
      mutate: vi.fn().mockResolvedValue({}),
      loading: false,
    });

    // Mock useApiQuery to return proper structure (used by useExecutions internally)
    // This is a fallback in case useExecutions mock doesn't work
    mockUseApiQuery.mockReturnValue({
      data: mockExecutions,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('should return executions data', () => {
    const { result } = renderHook(() => useReports());
    
    // Mock should return mockExecutions
    expect(result.current.executions).toEqual(mockExecutions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should filter executions', async () => {
    const { result } = renderHook(() => useReports());
    
    await act(async () => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'Test 1',
      });
    });

    await waitFor(() => {
      expect(result.current.filteredExecutions).toBeDefined();
    });
  });

  it('should detect active filters', async () => {
    const { result } = renderHook(() => useReports());
    
    expect(result.current.hasActiveFilters).toBe(false);
    
    await act(async () => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'test',
      });
    });

    await waitFor(() => {
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  it('should clear filters', async () => {
    const { result } = renderHook(() => useReports());
    
    await act(async () => {
      result.current.setFilters({
        ...result.current.filters,
        search: 'test',
        suite: ['E2E'],
      });
    });

    await act(async () => {
      result.current.clearFilters();
    });

    await waitFor(() => {
      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.suite).toEqual([]);
    });
  });

  it('should handle sort', () => {
    // Clear any previous calls
    sharedMockHandleSort.mockClear();
    
    const { result } = renderHook(() => useReports());

    // Verify handleSort exists and can be called
    expect(result.current.handleSort).toBeDefined();
    expect(typeof result.current.handleSort).toBe('function');

    act(() => {
      result.current.handleSort('workflowName');
    });

    // The handleSort function should call the sorting hook's handleSort
    // Since we're mocking useSorting, verify that our mock handleSort was called
    expect(sharedMockHandleSort).toHaveBeenCalledWith('workflowName');
  });

  it('should calculate filtered stats', () => {
    // Ensure mock is set up correctly
    mockUseSorting.mockReturnValue({
      sortedData: mockExecutions,
      sortField: 'startTime' as const,
      sortOrder: 'desc' as const,
      handleSort: vi.fn(),
    });

    const { result } = renderHook(() => useReports());
    
    expect(result.current.filteredStats).toBeDefined();
    // filteredStats depends on sortedExecutions which comes from useSorting mock
    // The mock returns mockExecutions, so totalExecutions should be 2
    expect(result.current.filteredStats.totalExecutions).toBe(mockExecutions.length);
  });

  it('should manage selected executions', async () => {
    const { result } = renderHook(() => useReports());
    
    await act(async () => {
      result.current.setSelectedExecutions(new Set(['exec-1']));
    });

    await waitFor(() => {
      expect(result.current.selectedExecutions.has('exec-1')).toBe(true);
    });
  });
});

