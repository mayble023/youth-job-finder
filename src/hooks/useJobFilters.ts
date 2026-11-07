import { useCallback, useEffect, useState } from 'react';

import { EMPTY_JOB_FILTERS, type JobFilters } from '@/services/jobs';
import { loadJobFilters, saveJobFilters } from '@/services/localCache';

/** Job filters that are remembered between app launches. */
export function useJobFilters() {
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

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.category !== null ||
    filters.jobType !== null ||
    filters.town !== null;

  return { filters, updateFilters, clearFilters, hasActiveFilters, isRestored };
}
