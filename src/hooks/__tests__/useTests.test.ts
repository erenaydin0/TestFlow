import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useTests from '../useTests';
import { TestService } from '@/utils/api';
import { Test } from '@/types';

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

describe('useTests', () => {
  const mockTests: Test[] = [
    {
      id: 'test-1',
      name: 'Test 1',
      workflow: [],
      suite: 'E2E',
      tags: ['smoke'],
      browserType: 'chromium',
    },
    {
      id: 'test-2',
      name: 'Test 2',
      workflow: [],
      suite: 'Integration',
      tags: ['regression'],
      browserType: 'firefox',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseApiQuery.mockReturnValue({
      data: mockTests,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseApiMutation.mockReturnValue({
      mutate: vi.fn().mockResolvedValue({}),
      loading: false,
    });
  });

  it('should return tests data', () => {
    const { result } = renderHook(() => useTests());
    
    expect(result.current.tests).toEqual(mockTests);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should filter tests', () => {
    const { result } = renderHook(() => useTests());
    
    act(() => {
      result.current.setFilters({
        search: 'Test 1',
        suite: [],
        tags: [],
        browserType: [],
      });
    });

    expect(result.current.filteredTests).toHaveLength(1);
    expect(result.current.filteredTests[0].name).toBe('Test 1');
  });

  it('should provide filter options', () => {
    const { result } = renderHook(() => useTests());
    
    expect(result.current.filterOptions.suites).toContain('E2E');
    expect(result.current.filterOptions.suites).toContain('Integration');
    expect(result.current.filterOptions.tags).toContain('smoke');
    expect(result.current.filterOptions.tags).toContain('regression');
  });

  it('should delete test', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useTests());
    
    await act(async () => {
      await result.current.deleteTest('test-1');
    });

    expect(mockMutate).toHaveBeenCalledWith('test-1');
  });

  it('should duplicate test', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ id: 'test-1-copy' });
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useTests());
    
    await act(async () => {
      const newId = await result.current.duplicateTest('test-1');
      expect(newId).toBe('test-1-copy');
    });
  });

  it('should update test', async () => {
    const mockMutate = vi.fn().mockResolvedValue({});
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useTests());
    const updatedTest = { ...mockTests[0], name: 'Updated Test' };
    
    await act(async () => {
      await result.current.updateTest('test-1', updatedTest);
    });

    expect(mockMutate).toHaveBeenCalledWith({ testId: 'test-1', updatedTest });
  });

  it('should bulk delete tests', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ deletedCount: 2 });
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useTests());
    
    await act(async () => {
      const count = await result.current.bulkDeleteTests(['test-1', 'test-2']);
      expect(count).toBe(2);
    });
  });

  it('should bulk duplicate tests', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ duplicatedCount: 2 });
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });

    const { result } = renderHook(() => useTests());
    
    await act(async () => {
      const count = await result.current.bulkDuplicateTests(['test-1', 'test-2']);
      expect(count).toBe(2);
    });
  });

  it('should handle loading states', () => {
    mockUseApiMutation.mockReturnValue({
      mutate: vi.fn(),
      loading: true,
    });

    const { result } = renderHook(() => useTests());
    
    expect(result.current.isDeleting).toBe(true);
    expect(result.current.isDuplicating).toBe(true);
    expect(result.current.isUpdating).toBe(true);
  });

  it('should respect autoLoad option', () => {
    renderHook(() => useTests({ autoLoad: false }));
    
    expect(mockUseApiQuery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});

