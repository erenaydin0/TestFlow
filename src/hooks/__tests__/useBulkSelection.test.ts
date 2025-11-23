import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useBulkSelection from '../useBulkSelection';

interface TestItem {
  id: string;
  name: string;
}

describe('useBulkSelection', () => {
  const mockItems: TestItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const getItemId = (item: TestItem) => item.id;

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.hasSelection).toBe(false);
  });

  it('should select item', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.selectItem('1');
    });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('1')).toBe(true);
    expect(result.current.hasSelection).toBe(true);
  });

  it('should deselect item', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.selectItem('1');
      result.current.deselectItem('1');
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('should toggle item', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.toggleItem('1');
    });

    expect(result.current.isSelected('1')).toBe(true);

    act(() => {
      result.current.toggleItem('1');
    });

    expect(result.current.isSelected('1')).toBe(false);
  });

  it('should select all items', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isPartiallySelected).toBe(false);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.selectAll();
      result.current.clearSelection();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('should toggle all items', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(true);

    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(false);
  });

  it('should detect partial selection', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.selectItem('1');
      result.current.selectItem('2');
    });

    expect(result.current.isPartiallySelected).toBe(true);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('should get selected items', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.selectItem('1');
      result.current.selectItem('2');
    });

    const selected = result.current.getSelectedItems(mockItems, getItemId);
    expect(selected).toHaveLength(2);
    expect(selected.map(i => i.id)).toEqual(['1', '2']);
  });

  it('should call onSelectionChange callback', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId, onSelectionChange })
    );

    act(() => {
      result.current.selectItem('1');
    });

    expect(onSelectionChange).toHaveBeenCalledWith(expect.any(Set));
    expect(onSelectionChange.mock.calls[0][0].has('1')).toBe(true);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: [], getItemId })
    );

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.hasSelection).toBe(false);
  });

  it('should set selected items directly', () => {
    const { result } = renderHook(() =>
      useBulkSelection({ items: mockItems, getItemId })
    );

    act(() => {
      result.current.setSelectedItems(new Set(['1', '2']));
    });

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isSelected('1')).toBe(true);
    expect(result.current.isSelected('2')).toBe(true);
    expect(result.current.isSelected('3')).toBe(false);
  });
});

