import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePagination from '../usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('should initialize with first page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPageItems).toHaveLength(10);
  });

  it('should calculate correct pagination info', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    expect(result.current.paginationInfo).toEqual({
      currentPage: 1,
      totalPages: 3,
      totalItems: 25,
      startIndex: 0,
      endIndex: 10,
      hasNextPage: true,
      hasPreviousPage: false,
      itemsPerPage: 10,
    });
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToNextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentPageItems).toHaveLength(10);
    expect(result.current.paginationInfo.hasNextPage).toBe(true);
    expect(result.current.paginationInfo.hasPreviousPage).toBe(true);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToNextPage();
    });
    
    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.goToPreviousPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should navigate to specific page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.currentPageItems).toHaveLength(5);
    expect(result.current.paginationInfo.hasNextPage).toBe(false);
  });

  it('should not go beyond first page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToPreviousPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should not go beyond last page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToPage(10); // Beyond total pages
    });

    expect(result.current.currentPage).toBe(3); // Should clamp to last page
  });

  it('should go to first page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToPage(3);
    });
    
    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.goToFirstPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should go to last page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToLastPage();
    });

    expect(result.current.currentPage).toBe(3);
  });

  it('should reset to first page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
      })
    );

    act(() => {
      result.current.goToPage(3);
      result.current.resetToFirstPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should call onPageChange callback', () => {
    const onPageChange = vi.fn();
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 10,
        onPageChange,
      })
    );

    act(() => {
      result.current.goToPage(2);
    });

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 0,
        data: [],
        itemsPerPage: 10,
      })
    );

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPageItems).toHaveLength(0);
  });

  it('should handle custom itemsPerPage', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 25,
        data: mockData,
        itemsPerPage: 5,
      })
    );

    expect(result.current.totalPages).toBe(5);
    expect(result.current.currentPageItems).toHaveLength(5);
  });

  it('should reset to first page when totalItems changes', () => {
    const { result, rerender } = renderHook(
      ({ totalItems }) =>
        usePagination({
          totalItems,
          data: mockData,
          itemsPerPage: 10,
        }),
      {
        initialProps: { totalItems: 25 },
      }
    );

    act(() => {
      result.current.goToPage(3);
    });

    rerender({ totalItems: 5 }); // Less items, should reset

    expect(result.current.currentPage).toBe(1);
  });
});

