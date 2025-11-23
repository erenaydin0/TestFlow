import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useExecutions from '../useExecutions';
import { ExecutionService } from '@/utils/api';
import { ExecutionResult } from '@/types';

// Mock ExecutionService
vi.mock('@/utils/api', () => ({
  ExecutionService: {
    fetchExecutions: vi.fn(),
  },
  useApiQuery: vi.fn(),
}));

// Mock useApiQuery
const mockUseApiQuery = vi.fn();
vi.mock('@/utils/api', async () => {
  const actual = await vi.importActual('@/utils/api');
  return {
    ...actual,
    useApiQuery: (queryFn: () => Promise<any>, options: any) => {
      return mockUseApiQuery(queryFn, options);
    },
  };
});

describe('useExecutions', () => {
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
        browserType: 'chromium',
      },
      steps: [],
      screenshots: [],
      logs: [],
      duration: 3000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApiQuery.mockReturnValue({
      data: mockExecutions,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('should return executions data', () => {
    const { result } = renderHook(() => useExecutions());
    
    expect(result.current.executions).toEqual(mockExecutions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should calculate stats correctly', () => {
    const { result } = renderHook(() => useExecutions());
    
    expect(result.current.stats.totalExecutions).toBe(2);
    expect(result.current.stats.completedExecutions).toBe(1);
    expect(result.current.stats.failedExecutions).toBe(1);
    expect(result.current.stats.successRate).toBe(50);
  });

    it('should calculate average duration', () => {
      const { result } = renderHook(() => useExecutions());
      
      // Both executions have duration: (5000 + 3000) / 2 = 4000
      expect(result.current.stats.avgDuration).toBe(4000);
    });

  it('should handle empty executions', () => {
    mockUseApiQuery.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useExecutions());
    
    expect(result.current.stats.totalExecutions).toBe(0);
    expect(result.current.stats.completedExecutions).toBe(0);
    expect(result.current.stats.failedExecutions).toBe(0);
    expect(result.current.stats.successRate).toBe(0);
    expect(result.current.stats.avgDuration).toBe(0);
  });

  it('should provide refresh function', () => {
    const mockRefetch = vi.fn();
    mockUseApiQuery.mockReturnValue({
      data: mockExecutions,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useExecutions());
    
    result.current.refresh();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should provide calculateStats function', () => {
    const { result } = renderHook(() => useExecutions());
    
    const customStats = result.current.calculateStats(mockExecutions);
    expect(customStats.totalExecutions).toBe(2);
    expect(customStats.completedExecutions).toBe(1);
  });

  it('should handle loading state', () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useExecutions());
    
    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to fetch',
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useExecutions());
    
    expect(result.current.error).toBe('Failed to fetch');
  });

  it('should respect autoFetch option', () => {
    renderHook(() => useExecutions({ autoFetch: false }));
    
    expect(mockUseApiQuery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});

