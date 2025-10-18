'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { Test, TestFilters } from '@/types';
import { filterTests, getUniqueFilterOptions } from '@/utils/fileUtils';
import { API_URL } from '@/utils/config';

interface UseTestsOptions {
  autoLoad?: boolean;
}

const useTests = (options: UseTestsOptions = {}) => {
  const { autoLoad = true } = options;
  
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    suite: [],
    tags: [],
    browserType: []
  });

  // Load tests from backend
  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/tests`);
      if (!response.ok) throw new Error('Testler yüklenemedi');
      
      const data = await response.json();
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      console.error('Testler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const deleteTest = async (testId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Test silinemedi');
      
      await loadTests();
      return true;
    } catch (error) {
      console.error('Test silinirken hata:', error);
      return false;
    }
  };

  // Duplicate test
  const duplicateTest = async (testId: string): Promise<string | null> => {
    try {
      const test = tests.find(t => t.id === testId);
      if (!test) return null;
      
      const duplicatedTest = {
        ...test,
        id: undefined, // Backend yeni ID oluşturacak
        name: `${test.name} (Kopya)`,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      const response = await fetch(`${API_URL}/api/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedTest)
      });
      
      if (!response.ok) throw new Error('Test kopyalanamadı');
      
      const newTest = await response.json();
      await loadTests();
      return newTest.id;
    } catch (error) {
      console.error('Test kopyalanırken hata:', error);
      return null;
    }
  };

  // Update test
  const updateTest = async (testId: string, updatedTest: Test): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTest)
      });
      
      if (!response.ok) throw new Error('Test güncellenemedi');
      
      const updated = await response.json();
      setTests(prev => prev.map(t => t.id === testId ? updated : t));
      return true;
    } catch (error) {
      console.error('Test güncellenirken hata:', error);
      return false;
    }
  };

  // Bulk delete tests
  const bulkDeleteTests = async (testIds: string[]): Promise<number> => {
    let deletedCount = 0;
    
    for (const testId of testIds) {
      if (await deleteTest(testId)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  };

  // Bulk duplicate tests
  const bulkDuplicateTests = async (testIds: string[]): Promise<number> => {
    let duplicatedCount = 0;
    
    for (const testId of testIds) {
      if (await duplicateTest(testId)) {
        duplicatedCount++;
      }
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
    error,
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
