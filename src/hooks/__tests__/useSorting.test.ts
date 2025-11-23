import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSorting from '../useSorting';

interface TestItem {
  id: string;
  name: string;
  value: number;
  date: Date;
  nested?: {
    prop: string;
  };
}

describe('useSorting', () => {
  const mockData: TestItem[] = [
    { id: '1', name: 'Charlie', value: 30, date: new Date('2024-01-03') },
    { id: '2', name: 'Alice', value: 10, date: new Date('2024-01-01') },
    { id: '3', name: 'Bob', value: 20, date: new Date('2024-01-02') },
  ];

  it('should return unsorted data when no sort field', () => {
    const { result } = renderHook(() =>
      useSorting({ data: mockData })
    );

    expect(result.current.sortedData).toEqual(mockData);
    expect(result.current.sortField).toBe('');
  });

  it('should sort by string field ascending', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortedData[0].name).toBe('Alice');
    expect(result.current.sortedData[1].name).toBe('Bob');
    expect(result.current.sortedData[2].name).toBe('Charlie');
  });

  it('should sort by string field descending', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'name',
        defaultSortOrder: 'desc',
      })
    );

    expect(result.current.sortedData[0].name).toBe('Charlie');
    expect(result.current.sortedData[2].name).toBe('Alice');
  });

  it('should sort by number field', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'value',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortedData[0].value).toBe(10);
    expect(result.current.sortedData[1].value).toBe(20);
    expect(result.current.sortedData[2].value).toBe(30);
  });

  it('should sort by date field', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'date',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortedData[0].id).toBe('2'); // 2024-01-01
    expect(result.current.sortedData[1].id).toBe('3'); // 2024-01-02
    expect(result.current.sortedData[2].id).toBe('1'); // 2024-01-03
  });

  it('should toggle sort order when clicking same field', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortOrder).toBe('asc');
    
    act(() => {
      result.current.handleSort('name');
    });

    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.sortedData[0].name).toBe('Charlie');
  });

  it('should set new field when clicking different field', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
      })
    );

    act(() => {
      result.current.handleSort('value');
    });

    expect(result.current.sortField).toBe('value');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should handle nested properties', () => {
    const dataWithNested = [
      { id: '1', nested: { prop: 'Zebra' } },
      { id: '2', nested: { prop: 'Alpha' } },
    ];

    const { result } = renderHook(() =>
      useSorting({ 
        data: dataWithNested,
        defaultSortField: 'nested.prop',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortedData[0].nested.prop).toBe('Alpha');
    expect(result.current.sortedData[1].nested.prop).toBe('Zebra');
  });

  it('should use custom sorters', () => {
    const customSorters = {
      name: (a: TestItem, b: TestItem) => {
        // Reverse alphabetical
        return b.name.localeCompare(a.name);
      },
    };

    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
        customSorters,
      })
    );

    expect(result.current.sortedData[0].name).toBe('Charlie');
  });

  it('should reset sorting', () => {
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
      })
    );

    act(() => {
      result.current.handleSort('value');
      result.current.setSortOrder('desc');
    });

    expect(result.current.sortField).toBe('value');
    expect(result.current.sortOrder).toBe('desc');

    act(() => {
      result.current.resetSorting();
    });

    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() =>
      useSorting({ data: [] })
    );

    expect(result.current.sortedData).toEqual([]);
  });

  it('should handle null/undefined values', () => {
    const dataWithNulls = [
      { id: '1', name: 'Alice', value: 10 },
      { id: '2', name: null as any, value: 20 },
      { id: '3', name: 'Bob', value: 30 },
    ];

    const { result } = renderHook(() =>
      useSorting({ 
        data: dataWithNulls,
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortedData).toHaveLength(3);
  });

  it('should call onSortChange callback', () => {
    const onSortChange = vi.fn();
    const { result } = renderHook(() =>
      useSorting({ 
        data: mockData,
        onSortChange,
      })
    );

    act(() => {
      result.current.handleSort('name');
    });

    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
  });

  it('should handle array values (sort by length)', () => {
    const dataWithArrays = [
      { id: '1', tags: ['a', 'b', 'c'] },
      { id: '2', tags: ['a'] },
      { id: '3', tags: ['a', 'b'] },
    ];

    const { result } = renderHook(() =>
      useSorting({ 
        data: dataWithArrays,
        defaultSortField: 'tags',
        defaultSortOrder: 'asc',
      })
    );

    expect(result.current.sortedData[0].tags.length).toBe(1);
    expect(result.current.sortedData[2].tags.length).toBe(3);
  });
});

