'use client';

import { useState, useEffect, useMemo } from 'react';

import { ExecutionResult, ExecutionStats, UseExecutionsOptions } from '@/types';
import { API_URL } from '@/lib/config';

const useExecutions = (options: UseExecutionsOptions = {}) => {
  const { autoFetch = true } = options;
  
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch executions from backend
  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/executions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExecutions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching executions:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchExecutions();
    }
  }, [autoFetch]);

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
  const stats = useMemo(() => calculateStats(executions), [executions]);

  // Refresh function
  const refresh = () => {
    fetchExecutions();
  };

  return {
    executions,
    loading,
    error,
    stats,
    fetchExecutions,
    refresh,
    calculateStats
  };
};

export default useExecutions;
