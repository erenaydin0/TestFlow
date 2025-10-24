'use client';

import { useState, useMemo, useCallback } from 'react';

export interface UseBulkSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export interface UseBulkSelectionReturn {
  // State
  selectedItems: Set<string>;
  setSelectedItems: (items: Set<string>) => void;
  
  // Computed values
  selectedCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  hasSelection: boolean;
  
  // Actions
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleItem: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleAll: () => void;
  isSelected: (id: string) => boolean;
  
  // Utility
  getSelectedItems: <T extends Record<string, any>>(items: T[], getItemId: (item: T) => string) => T[];
}

const useBulkSelection = <T extends Record<string, any>>({
  items,
  getItemId,
  onSelectionChange
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Computed values
  const selectedCount = selectedItems.size;
  const totalItems = items.length;
  const isAllSelected = totalItems > 0 && selectedCount === totalItems;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;
  const hasSelection = selectedCount > 0;

  // Get selected items from the original items array
  const getSelectedItems = useCallback(<T extends Record<string, any>>(
    items: T[], 
    getItemId: (item: T) => string
  ): T[] => {
    return items.filter(item => selectedItems.has(getItemId(item)));
  }, [selectedItems]);

  // Individual item selection
  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      newSelection.add(id);
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);

  const deselectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(id);
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);

  const toggleItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);

  // Bulk selection
  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(item => getItemId(item)));
    setSelectedItems(allIds);
    onSelectionChange?.(allIds);
  }, [items, getItemId, onSelectionChange]);

  const clearSelection = useCallback(() => {
    const emptySet = new Set<string>();
    setSelectedItems(emptySet);
    onSelectionChange?.(emptySet);
  }, [onSelectionChange]);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  // Check if item is selected
  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  return {
    // State
    selectedItems,
    setSelectedItems,
    
    // Computed values
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    hasSelection,
    
    // Actions
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    clearSelection,
    toggleAll,
    isSelected,
    
    // Utility
    getSelectedItems
  };
};

export default useBulkSelection;
