'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { Test, TestFilters } from '@/types';
import { filterTests, getUniqueFilterOptions } from '@/utils/fileUtils';
import { useApiQuery, useApiMutation, TestService } from '@/utils/api';

interface UseTestsOptions {
  autoLoad?: boolean;
}

interface UseTestsReturn {
  // Data
  tests: Test[];
  loading: boolean;
  error: string | null;
  filteredTests: Test[];

  // Filtering
  filters: TestFilters;
  setFilters: (filters: TestFilters) => void;
  filterOptions: {
    suites: string[];
    tags: string[];
    browsers: string[];
  };

  // Actions
  loadTests: () => void;
  refresh: () => void;
  deleteTest: (testId: string) => Promise<boolean>;
  duplicateTest: (testId: string) => Promise<string | null>;
  updateTest: (testId: string, updatedTest: Test) => Promise<boolean>;
  bulkDeleteTests: (testIds: string[]) => Promise<number>;
  bulkDuplicateTests: (testIds: string[]) => Promise<number>;

  // Loading states
  isDeleting: boolean;
  isDuplicating: boolean;
  isUpdating: boolean;
  isBulkDeleting: boolean;
  isBulkDuplicating: boolean;
}

const useTests = (options: UseTestsOptions = {}): UseTestsReturn => {
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
      autoRefetch: refetch,
    }
  );

  // Duplicate test mutation
  const duplicateTestMutation = useApiMutation(
    (testId: string) => TestService.duplicateTest(testId),
    {
      autoRefetch: refetch,
    }
  );

  // Update test mutation
  const updateTestMutation = useApiMutation(
    ({ testId, updatedTest }: { testId: string; updatedTest: Test }) =>
      TestService.updateTest(testId, updatedTest),
    {
      autoRefetch: refetch,
    }
  );

  // Bulk operations mutations
  const bulkDeleteMutation = useApiMutation(
    (testIds: string[]) => TestService.bulkDeleteTests(testIds),
    {
      autoRefetch: refetch,
    }
  );

  const bulkDuplicateMutation = useApiMutation(
    (testIds: string[]) => TestService.bulkDuplicateTests(testIds),
    {
      autoRefetch: refetch,
    }
  );

  // Wrapper functions for backward compatibility
  const deleteTest = async (testId: string): Promise<boolean> => {
    try {
      const result = await deleteTestMutation.mutate(testId);
      return result !== null;
    } catch (error) {
      console.error('Delete test error:', error);
      return false;
    }
  };

  const duplicateTest = async (testId: string): Promise<string | null> => {
    try {
      const result = await duplicateTestMutation.mutate(testId);
      return result?.id || null;
    } catch (error) {
      console.error('Duplicate test error:', error);
      return null;
    }
  };

  const updateTest = async (testId: string, updatedTest: Test): Promise<boolean> => {
    try {
      const result = await updateTestMutation.mutate({ testId, updatedTest });
      return result !== null;
    } catch (error) {
      console.error('Update test error:', error);
      return false;
    }
  };

  const bulkDeleteTests = async (testIds: string[]): Promise<number> => {
    try {
      const result = await bulkDeleteMutation.mutate(testIds);
      return result?.deletedCount || 0;
    } catch (error) {
      console.error('Bulk delete tests error:', error);
      return 0;
    }
  };

  const bulkDuplicateTests = async (testIds: string[]): Promise<number> => {
    try {
      const result = await bulkDuplicateMutation.mutate(testIds);
      return result?.duplicatedCount || 0;
    } catch (error) {
      console.error('Bulk duplicate tests error:', error);
      return 0;
    }
  };

  // Refresh function
  const refresh = () => {
    refetch();
  };

  return {
    tests: tests || [],
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
    bulkDuplicateTests,
    // Mutation loading states
    isDeleting: deleteTestMutation.loading,
    isDuplicating: duplicateTestMutation.loading,
    isUpdating: updateTestMutation.loading,
    isBulkDeleting: bulkDeleteMutation.loading,
    isBulkDuplicating: bulkDuplicateMutation.loading
  };
};

export default useTests;
