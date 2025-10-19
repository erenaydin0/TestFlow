'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { ExecutionResult, ExecutionStats, UseExecutionsOptions } from '@/types';
import { useApiQuery, ExecutionService } from '@/utils/api';

const useExecutions = (options: UseExecutionsOptions = {}) => {
  const { autoFetch = true } = options;
  
  // Use API query hook for fetching executions
  const fetchExecutionsFn = useCallback(() => ExecutionService.fetchExecutions(), []);
  const { data: executions = [], loading, error, refetch } = useApiQuery(
    fetchExecutionsFn,
    {
      enabled: autoFetch,
      refetchOnMount: true,
    }
  );

  // Calculate stats from executions
  const calculateStats = (executionList: ExecutionResult[]): ExecutionStats => {
    return {
      totalExecutions: executionList.length,
      completedExecutions: executionList.filter(e => e.status === 'completed').length,
      failedExecutions: executionList.filter(e => e.status === 'failed').length,
      avgDuration: executionList.length > 0 ? 
        Math.round(executionList.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / executionList.filter(e => e.duration).length) : 0,
      successRate: executionList.length > 0 ? 
        Math.round((executionList.filter(e => e.status === 'completed').length / executionList.length) * 100) : 0
    };
  };

  // Stats for all executions
  const stats = useMemo(() => calculateStats(executions || []), [executions]);

  // Refresh function
  const refresh = () => {
    refetch();
  };

  return {
    executions,
    loading,
    error,
    stats,
    fetchExecutions: refresh, // Alias for backward compatibility
    refresh,
    calculateStats
  };
};

export default useExecutions;
