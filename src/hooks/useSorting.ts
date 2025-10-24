'use client';

import { useState, useMemo, useCallback } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface UseSortingOptions<T> {
  data: T[];
  defaultSortField?: string;
  defaultSortOrder?: SortOrder;
  onSortChange?: (field: string, order: SortOrder) => void;
}

export interface UseSortingReturn<T> {
  // State
  sortField: string;
  sortOrder: SortOrder;
  
  // Computed values
  sortedData: T[];
  
  // Actions
  handleSort: (field: string) => void;
  setSortField: (field: string) => void;
  setSortOrder: (order: SortOrder) => void;
  resetSorting: () => void;
}

const useSorting = <T extends Record<string, any>>({
  data,
  defaultSortField,
  defaultSortOrder = 'asc',
  onSortChange
}: UseSortingOptions<T>): UseSortingReturn<T> => {
  const [sortField, setSortField] = useState<string>(defaultSortField || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  // Sort data based on current sort field and order
  const sortedData = useMemo(() => {
    if (!sortField || data.length === 0) {
      return data;
    }

    const sorted = [...data];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle nested properties (e.g., 'options.browserType')
      if (sortField.includes('.')) {
        const keys = sortField.split('.');
        aValue = keys.reduce((obj: any, key: string) => obj?.[key], a);
        bValue = keys.reduce((obj: any, key: string) => obj?.[key], b);
      } else {
        aValue = a[sortField as keyof T];
        bValue = b[sortField as keyof T];
      }

      // Handle different data types
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convert to comparable values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (typeof aValue === 'string' && !isNaN(Date.parse(aValue)) && 
          typeof bValue === 'string' && !isNaN(Date.parse(bValue))) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle arrays (e.g., tags length)
      if (Array.isArray(aValue)) aValue = aValue.length;
      if (Array.isArray(bValue)) bValue = bValue.length;

      // Compare values
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortField, sortOrder]);

  // Handle sort field change
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // Toggle order if same field
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      onSortChange?.(field, newOrder);
    } else {
      // Set new field with default order
      setSortField(field);
      setSortOrder('asc');
      onSortChange?.(field, 'asc');
    }
  }, [sortField, sortOrder, onSortChange]);

  // Reset sorting to defaults
  const resetSorting = useCallback(() => {
    const field = defaultSortField || '';
    setSortField(field);
    setSortOrder(defaultSortOrder);
    onSortChange?.(field, defaultSortOrder);
  }, [defaultSortField, defaultSortOrder, onSortChange]);

  return {
    // State
    sortField,
    sortOrder,
    
    // Computed values
    sortedData,
    
    // Actions
    handleSort,
    setSortField,
    setSortOrder,
    resetSorting
  };
};

export default useSorting;
