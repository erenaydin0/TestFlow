'use client';

import { useState, useEffect, useMemo } from 'react';

import { ExecutionResult, BrowserType, ExecutionFilters, ExecutionStats, UseReportsOptions } from '@/types';
import { filterExecutions, getUniqueFilterOptions } from '@/utils/fileUtils';
import { useApiMutation, ExecutionService } from '@/utils/api';
import useExecutions from './useExecutions';
import useSorting from './useSorting';

type SortField = 'startTime' | 'duration' | 'workflowName' | 'status' | 'successRate' | 'suite' | 'tags' | 'browserType';

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
  
  const [selectedExecutions, setSelectedExecutions] = useState<Set<string>>(new Set());

  // Filter executions
  const filteredExecutions = useMemo(() => {
    return filterExecutions(executions || [], filters);
  }, [executions, filters]);

  // Use sorting hook
  const sorting = useSorting({
    data: filteredExecutions,
    defaultSortField: 'startTime',
    defaultSortOrder: 'desc',
    customSorters: {
      workflowName: (a: ExecutionResult, b: ExecutionResult) => 
        a.workflowName.toLowerCase().localeCompare(b.workflowName.toLowerCase()),
      startTime: (a: ExecutionResult, b: ExecutionResult) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      duration: (a: ExecutionResult, b: ExecutionResult) => 
        (a.duration || 0) - (b.duration || 0),
      status: (a: ExecutionResult, b: ExecutionResult) => 
        a.status.localeCompare(b.status),
      successRate: (a: ExecutionResult, b: ExecutionResult) => 
        (a.successRate || 0) - (b.successRate || 0),
      suite: (a: ExecutionResult, b: ExecutionResult) => 
        (a.suite || '').toLowerCase().localeCompare((b.suite || '').toLowerCase()),
      tags: (a: ExecutionResult, b: ExecutionResult) => 
        (a.tags || []).length - (b.tags || []).length,
      browserType: (a: ExecutionResult, b: ExecutionResult) => 
        (a.options?.browserType || 'chromium').localeCompare(b.options?.browserType || 'chromium')
    }
  });

  const sortedExecutions = sorting.sortedData;

  // Calculate stats for filtered results - stable reference
  const filteredStats = useMemo(() => {
    const filtered = sortedExecutions;
    const completedCount = filtered.filter(e => e.status === 'completed').length;
    const failedCount = filtered.filter(e => e.status === 'failed').length;
    const totalCount = filtered.length;
    
    const executionsWithDuration = filtered.filter(e => e.duration);
    const avgDuration = executionsWithDuration.length > 0 ? 
      Math.round(executionsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / executionsWithDuration.length) : 0;
    
    const successRate = totalCount > 0 ? 
      Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalExecutions: totalCount,
      completedExecutions: completedCount,
      failedExecutions: failedCount,
      avgDuration,
      successRate
    };
  }, [sortedExecutions]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    return getUniqueFilterOptions([], executions || []);
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

  // Handle sorting - delegate to sorting hook
  const handleSort = (field: SortField) => {
    sorting.handleSort(field);
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

  // Delete execution mutation
  const deleteExecutionMutation = useApiMutation(
    (executionId: string) => ExecutionService.deleteExecution(executionId),
    {
      onSuccess: async () => {
        await refreshExecutions();
      },
    }
  );

  // Bulk delete executions mutation
  const bulkDeleteMutation = useApiMutation(
    (executionIds: string[]) => ExecutionService.bulkDeleteExecutions(executionIds),
    {
      onSuccess: async () => {
        await refreshExecutions();
      },
    }
  );

  // Wrapper functions for backward compatibility
  const deleteExecution = async (executionId: string): Promise<boolean> => {
    const result = await deleteExecutionMutation.mutate(executionId);
    return result !== null;
  };

  const bulkDeleteExecutions = async (executionIds: string[]): Promise<number> => {
    const result = await bulkDeleteMutation.mutate(executionIds);
    return result?.deletedCount || 0;
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
    sortField: sorting.sortField,
    sortOrder: sorting.sortOrder,
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
