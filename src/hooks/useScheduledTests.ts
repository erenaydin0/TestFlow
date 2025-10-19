import { useState, useEffect, useCallback } from 'react';
import { ScheduledTest, ScheduledTestFilters, UpcomingRun } from '@/types/test';
import { useApiQuery, useApiMutation, ScheduledTestService } from '@/utils/api';

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
  const [filters, setFilters] = useState<ScheduledTestFilters>({
    search: '',
    status: [],
    environment: [],
    suite: []
  });

  // Use API query hook for fetching scheduled tests
  const fetchScheduledTestsFn = useCallback(() => ScheduledTestService.fetchScheduledTests(), []);
  const { data, loading, error, refetch } = useApiQuery(
    fetchScheduledTestsFn,
    {
      enabled: true,
      refetchOnMount: true,
    }
  );

  const scheduledTests = data?.scheduledTests || [];
  const upcomingRuns = data?.upcomingRuns || [];

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

  // Create schedule mutation
  const createScheduleMutation = useApiMutation(
    (schedule: Partial<ScheduledTest>) => ScheduledTestService.createScheduledTest(schedule as any),
    {
      onSuccess: () => refetch(),
    }
  );

  // Update schedule mutation
  const updateScheduleMutation = useApiMutation(
    ({ id, schedule }: { id: string; schedule: Partial<ScheduledTest> }) => 
      ScheduledTestService.updateScheduledTest(id, schedule),
    {
      onSuccess: () => refetch(),
    }
  );

  // Delete schedule mutation
  const deleteScheduleMutation = useApiMutation(
    (id: string) => ScheduledTestService.deleteScheduledTest(id),
    {
      onSuccess: () => refetch(),
    }
  );

  // Toggle schedule mutation
  const toggleScheduleMutation = useApiMutation(
    (id: string) => ScheduledTestService.toggleScheduledTest(id),
    {
      onSuccess: () => refetch(),
    }
  );

  // Pause schedule mutation
  const pauseScheduleMutation = useApiMutation(
    (id: string) => ScheduledTestService.pauseScheduledTest(id),
    {
      onSuccess: () => refetch(),
    }
  );

  // Resume schedule mutation
  const resumeScheduleMutation = useApiMutation(
    (id: string) => ScheduledTestService.resumeScheduledTest(id),
    {
      onSuccess: () => refetch(),
    }
  );

  // Wrapper functions for backward compatibility
  const createSchedule = async (schedule: Partial<ScheduledTest>): Promise<ScheduledTest | null> => {
    const result = await createScheduleMutation.mutate(schedule);
    return result;
  };

  const updateSchedule = async (id: string, schedule: Partial<ScheduledTest>): Promise<boolean> => {
    const result = await updateScheduleMutation.mutate({ id, schedule });
    return result !== null;
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    const result = await deleteScheduleMutation.mutate(id);
    return result !== null;
  };

  const toggleSchedule = async (id: string): Promise<boolean> => {
    const result = await toggleScheduleMutation.mutate(id);
    return result !== null;
  };

  const pauseSchedule = async (id: string): Promise<boolean> => {
    const result = await pauseScheduleMutation.mutate(id);
    return result !== null;
  };

  const resumeSchedule = async (id: string): Promise<boolean> => {
    const result = await resumeScheduleMutation.mutate(id);
    return result !== null;
  };

  return {
    scheduledTests,
    upcomingRuns,
    loading,
    error,
    filters,
    setFilters,
    filteredTests,
    refresh: refetch,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    pauseSchedule,
    resumeSchedule
  };
}
