'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { Test, TestFilters } from '@/types';
import { filterTests, getUniqueFilterOptions } from '@/utils/fileUtils';
import { useApiQuery, useApiMutation, TestService } from '@/utils/api';

interface UseTestsOptions {
  autoLoad?: boolean;
}

const useTests = (options: UseTestsOptions = {}) => {
  const { autoLoad = true } = options;
  
  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    suite: [],
    tags: [],
    browserType: []
  });

  // Use API query hook for fetching tests
  const fetchTestsFn = useCallback(() => TestService.fetchTests(), []);
  const { data: tests = [], loading, error, refetch } = useApiQuery(
    fetchTestsFn,
    {
      enabled: autoLoad,
      refetchOnMount: true,
    }
  );


  // Filter tests
  const filteredTests = useMemo(() => {
    return filterTests(tests || [], filters);
  }, [tests, filters]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    return getUniqueFilterOptions(tests || []);
  }, [tests]);

  // Delete test mutation
  const deleteTestMutation = useApiMutation(
    (testId: string) => TestService.deleteTest(testId),
    {
      onSuccess: () => refetch(),
    }
  );

  // Duplicate test mutation
  const duplicateTestMutation = useApiMutation(
    (testId: string) => TestService.duplicateTest(testId),
    {
      onSuccess: () => refetch(),
    }
  );

  // Update test mutation
  const updateTestMutation = useApiMutation(
    ({ testId, updatedTest }: { testId: string; updatedTest: Test }) => 
      TestService.updateTest(testId, updatedTest),
    {
      onSuccess: () => refetch(),
    }
  );

  // Bulk operations mutations
  const bulkDeleteMutation = useApiMutation(
    (testIds: string[]) => TestService.bulkDeleteTests(testIds),
    {
      onSuccess: () => refetch(),
    }
  );

  const bulkDuplicateMutation = useApiMutation(
    (testIds: string[]) => TestService.bulkDuplicateTests(testIds),
    {
      onSuccess: () => refetch(),
    }
  );

  // Wrapper functions for backward compatibility
  const deleteTest = async (testId: string): Promise<boolean> => {
    const result = await deleteTestMutation.mutate(testId);
    return result !== null;
  };

  const duplicateTest = async (testId: string): Promise<string | null> => {
    const result = await duplicateTestMutation.mutate(testId);
    return result?.id || null;
  };

  const updateTest = async (testId: string, updatedTest: Test): Promise<boolean> => {
    const result = await updateTestMutation.mutate({ testId, updatedTest });
    return result !== null;
  };

  const bulkDeleteTests = async (testIds: string[]): Promise<number> => {
    const result = await bulkDeleteMutation.mutate(testIds);
    return result?.deletedCount || 0;
  };

  const bulkDuplicateTests = async (testIds: string[]): Promise<number> => {
    const result = await bulkDuplicateMutation.mutate(testIds);
    return result?.duplicatedCount || 0;
  };

  // Refresh function
  const refresh = () => {
    refetch();
  };

  return {
    tests,
    loading,
    error,
    filteredTests,
    filters,
    setFilters,
    filterOptions,
    loadTests: refresh, // Alias for backward compatibility
    refresh,
    deleteTest,
    duplicateTest,
    updateTest,
    bulkDeleteTests,
    bulkDuplicateTests
  };
};

export default useTests;
