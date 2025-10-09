import { useState, useEffect, useCallback } from 'react';
import { ScheduledTest, ScheduledTestFilters, UpcomingRun } from '@/types/test';
import { API_URL } from '@/lib/config';

interface UseScheduledTestsReturn {
  scheduledTests: ScheduledTest[];
  upcomingRuns: UpcomingRun[];
  loading: boolean;
  error: string | null;
  filters: ScheduledTestFilters;
  setFilters: (filters: ScheduledTestFilters) => void;
  filteredTests: ScheduledTest[];
  refresh: () => void;
  createSchedule: (schedule: Partial<ScheduledTest>) => Promise<ScheduledTest | null>;
  updateSchedule: (id: string, schedule: Partial<ScheduledTest>) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<boolean>;
  toggleSchedule: (id: string) => Promise<boolean>;
  pauseSchedule: (id: string) => Promise<boolean>;
  resumeSchedule: (id: string) => Promise<boolean>;
}

export function useScheduledTests(): UseScheduledTestsReturn {
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [upcomingRuns, setUpcomingRuns] = useState<UpcomingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScheduledTestFilters>({
    search: '',
    status: [],
    environment: [],
    suite: []
  });

  const fetchScheduledTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/scheduled-tests`);
      if (!response.ok) throw new Error('Zamanlanmış testler yüklenemedi');
      
      const data = await response.json();
      setScheduledTests(data.scheduledTests || []);
      setUpcomingRuns(data.upcomingRuns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      console.error('Zamanlanmış testler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledTests();
  }, [fetchScheduledTests]);

  const filteredTests = scheduledTests.filter(test => {
    if (filters.search && !test.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !test.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(test.status)) {
      return false;
    }
    if (filters.environment.length > 0 && !filters.environment.includes(test.environment)) {
      return false;
    }
    if (filters.suite.length > 0 && !filters.suite.includes(test.suite)) {
      return false;
    }
    return true;
  });

  const createSchedule = async (schedule: Partial<ScheduledTest>): Promise<ScheduledTest | null> => {
    try {
      const response = await fetch(`${API_URL}/api/scheduled-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
      
      if (!response.ok) throw new Error('Zamanlama oluşturulamadı');
      
      const newSchedule = await response.json();
      setScheduledTests(prev => [...prev, newSchedule]);
      return newSchedule;
    } catch (err) {
      console.error('Zamanlama oluşturma hatası:', err);
      return null;
    }
  };

  const updateSchedule = async (id: string, schedule: Partial<ScheduledTest>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/scheduled-tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
      
      if (!response.ok) throw new Error('Zamanlama güncellenemedi');
      
      const updatedSchedule = await response.json();
      setScheduledTests(prev => prev.map(s => s.id === id ? updatedSchedule : s));
      return true;
    } catch (err) {
      console.error('Zamanlama güncelleme hatası:', err);
      return false;
    }
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/scheduled-tests/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Zamanlama silinemedi');
      
      setScheduledTests(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      console.error('Zamanlama silme hatası:', err);
      return false;
    }
  };

  const toggleSchedule = async (id: string): Promise<boolean> => {
    const schedule = scheduledTests.find(s => s.id === id);
    if (!schedule) return false;
    
    const newStatus: 'active' | 'paused' = schedule.status === 'active' ? 'paused' : 'active';
    return updateSchedule(id, { status: newStatus, enabled: newStatus === 'active' });
  };

  const pauseSchedule = async (id: string): Promise<boolean> => {
    return updateSchedule(id, { status: 'paused', enabled: false });
  };

  const resumeSchedule = async (id: string): Promise<boolean> => {
    return updateSchedule(id, { status: 'active', enabled: true });
  };

  return {
    scheduledTests,
    upcomingRuns,
    loading,
    error,
    filters,
    setFilters,
    filteredTests,
    refresh: fetchScheduledTests,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    pauseSchedule,
    resumeSchedule
  };
}
