'use client';

import { useState, useEffect, useMemo } from 'react';

import { ExecutionResult, BrowserType, ExecutionFilters, ExecutionStats, UseReportsOptions } from '@/types';
import { filterExecutions, getUniqueFilterOptions } from '@/lib/exportUtils';
import { API_URL } from '@/lib/config';
import useExecutions from './useExecutions';

type SortField = 'startTime' | 'duration' | 'workflowName' | 'status' | 'successRate' | 'suite' | 'tags' | 'browserType';
type SortOrder = 'asc' | 'desc';

interface ReportFilters {
  search: string;
  status?: string;
  dateRange?: string;
  specificDate?: string;
  startDate?: string;
  endDate?: string;
  suite: string[];
  tags: string[];
  browserType: BrowserType[];
}

const useReports = (options: UseReportsOptions = {}) => {
  const { autoFetch = true } = options;
  
  // Use base executions hook
  const { executions, loading, error, stats, refresh: refreshExecutions } = useExecutions({ autoFetch });
  
  // Reports-specific state
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    status: '',
    dateRange: '',
    specificDate: '',
    startDate: '',
    endDate: '',
    suite: [],
    tags: [],
    browserType: []
  });
  
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedExecutions, setSelectedExecutions] = useState<Set<string>>(new Set());

  // Filter executions
  const filteredExecutions = useMemo(() => {
    return filterExecutions(executions, filters);
  }, [executions, filters]);

  // Sort executions
  const sortedExecutions = useMemo(() => {
    const sorted = [...filteredExecutions];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'workflowName':
          aValue = a.workflowName.toLowerCase();
          bValue = b.workflowName.toLowerCase();
          break;
        case 'startTime':
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'successRate':
          aValue = a.successRate || 0;
          bValue = b.successRate || 0;
          break;
        case 'suite':
          aValue = (a.suite || '').toLowerCase();
          bValue = (b.suite || '').toLowerCase();
          break;
        case 'tags':
          aValue = (a.tags || []).length;
          bValue = (b.tags || []).length;
          break;
        case 'browserType':
          aValue = a.options?.browserType || 'chromium';
          bValue = b.options?.browserType || 'chromium';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredExecutions, sortField, sortOrder]);

  // Calculate stats for filtered results
  const filteredStats = useMemo(() => {
    const filtered = sortedExecutions;
    return {
      totalExecutions: filtered.length,
      completedExecutions: filtered.filter(e => e.status === 'completed').length,
      failedExecutions: filtered.filter(e => e.status === 'failed').length,
      avgDuration: filtered.length > 0 ? 
        Math.round(filtered.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / filtered.filter(e => e.duration).length) : 0,
      successRate: filtered.length > 0 ? 
        Math.round((filtered.filter(e => e.status === 'completed').length / filtered.length) * 100) : 0
    };
  }, [sortedExecutions]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    return getUniqueFilterOptions([], executions);
  }, [executions]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== '' && value !== null;
    });
  }, [filters]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateRange: '',
      specificDate: '',
      startDate: '',
      endDate: '',
      suite: [],
      tags: [],
      browserType: []
    });
  };

  // Delete execution (if needed)
  const deleteExecution = async (executionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/executions/${executionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        refreshExecutions(); // Refresh data after deletion
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting execution:', error);
      return false;
    }
  };

  // Bulk delete executions
  const bulkDeleteExecutions = async (executionIds: string[]): Promise<number> => {
    let deletedCount = 0;
    
    for (const id of executionIds) {
      if (await deleteExecution(id)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  };

  return {
    // Data
    executions,
    filteredExecutions,
    sortedExecutions,
    loading,
    error,
    
    // Stats
    stats, // Overall stats
    filteredStats, // Stats for filtered results
    
    // Filtering & Sorting
    filters,
    setFilters,
    filterOptions,
    hasActiveFilters,
    clearFilters,
    sortField,
    sortOrder,
    handleSort,
    
    // Selection
    selectedExecutions,
    setSelectedExecutions,
    
    // Actions
    refresh: refreshExecutions,
    deleteExecution,
    bulkDeleteExecutions
  };
};

export default useReports;
