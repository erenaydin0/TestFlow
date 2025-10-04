'use client';

import { useState, useEffect, useMemo } from 'react';

import { Test, BrowserType, TestFilters, TestFormData } from '@/types';
import { getSavedWorkflows, deleteWorkflow, duplicateWorkflow, updateWorkflow, migrateTestIds } from '@/lib/utils';
import { filterTests, getUniqueFilterOptions } from '@/lib/exportUtils';

interface UseTestsOptions {
  autoLoad?: boolean;
}

const useTests = (options: UseTestsOptions = {}) => {
  const { autoLoad = true } = options;
  
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    suite: [],
    tags: [],
    browserType: []
  });

  // Load tests from localStorage
  const loadTests = () => {
    try {
      setLoading(true);
      // Önce ID migration'ı çalıştır
      migrateTestIds();
      
      const savedWorkflows = getSavedWorkflows();
      setTests(savedWorkflows);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto load on mount
  useEffect(() => {
    if (autoLoad) {
      loadTests();
    }
  }, [autoLoad]);

  // Filter tests
  const filteredTests = useMemo(() => {
    return filterTests(tests, filters);
  }, [tests, filters]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    return getUniqueFilterOptions(tests);
  }, [tests]);

  // Delete test
  const deleteTest = (testId: string): boolean => {
    try {
      const success = deleteWorkflow(testId);
      if (success) {
        loadTests(); // Reload tests after deletion
      }
      return success;
    } catch (error) {
      console.error('Error deleting test:', error);
      return false;
    }
  };

  // Duplicate test
  const duplicateTest = (testId: string): string | null => {
    try {
      const duplicatedId = duplicateWorkflow(testId);
      if (duplicatedId) {
        loadTests(); // Reload tests after duplication
      }
      return duplicatedId;
    } catch (error) {
      console.error('Error duplicating test:', error);
      return null;
    }
  };

  // Update test
  const updateTest = (testId: string, updatedTest: Test): boolean => {
    try {
      updateWorkflow(testId, updatedTest);
      setTests(prev => prev.map(t => t.id === testId ? updatedTest : t));
      return true;
    } catch (error) {
      console.error('Error updating test:', error);
      return false;
    }
  };

  // Bulk delete tests
  const bulkDeleteTests = (testIds: string[]): number => {
    let deletedCount = 0;
    testIds.forEach(testId => {
      if (deleteWorkflow(testId)) {
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      loadTests(); // Reload tests after bulk deletion
    }
    
    return deletedCount;
  };

  // Bulk duplicate tests
  const bulkDuplicateTests = (testIds: string[]): number => {
    let duplicatedCount = 0;
    testIds.forEach(testId => {
      if (duplicateWorkflow(testId)) {
        duplicatedCount++;
      }
    });
    
    if (duplicatedCount > 0) {
      loadTests(); // Reload tests after bulk duplication
    }
    
    return duplicatedCount;
  };

  // Refresh function
  const refresh = () => {
    loadTests();
  };

  return {
    tests,
    loading,
    filteredTests,
    filters,
    setFilters,
    filterOptions,
    loadTests,
    refresh,
    deleteTest,
    duplicateTest,
    updateTest,
    bulkDeleteTests,
    bulkDuplicateTests
  };
};

export default useTests;
