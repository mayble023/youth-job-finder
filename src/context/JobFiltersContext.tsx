import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { EMPTY_JOB_FILTERS, type JobFilters } from '@/services/jobs';
import { loadJobFilters, saveJobFilters } from '@/services/localCache';

export type JobFiltersContextValue = {
  filters: JobFilters;
  updateFilters: (changes: Partial<JobFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  /** False until the filters saved on the phone have been loaded. */
  isRestored: boolean;
};

export const JobFiltersContext = createContext<JobFiltersContextValue | null>(null);

/**
 * Job filters shared by the Jobs and Map tabs (so the map shows what the list shows) and
 * remembered between app launches.
 */
export function JobFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<JobFilters>(EMPTY_JOB_FILTERS);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadJobFilters().then((saved) => {
      if (!isMounted) return;
      setFilters(saved);
      setIsRestored(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Waiting for the restore stops the empty defaults overwriting the saved filters.
  useEffect(() => {
    if (isRestored) void saveJobFilters(filters);
  }, [filters, isRestored]);

  const updateFilters = useCallback((changes: Partial<JobFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_JOB_FILTERS), []);

  const value = useMemo<JobFiltersContextValue>(
    () => ({
      filters,
      updateFilters,
      clearFilters,
      isRestored,
      hasActiveFilters:
        filters.search.trim() !== '' ||
        filters.category !== null ||
        filters.jobType !== null ||
        filters.town !== null,
    }),
    [filters, updateFilters, clearFilters, isRestored],
  );

  return <JobFiltersContext.Provider value={value}>{children}</JobFiltersContext.Provider>;
}
