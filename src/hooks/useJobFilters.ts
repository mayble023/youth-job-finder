import { useContext } from 'react';

import { JobFiltersContext, type JobFiltersContextValue } from '@/context/JobFiltersContext';

export function useJobFilters(): JobFiltersContextValue {
  const context = useContext(JobFiltersContext);
  if (!context) {
    throw new Error('useJobFilters must be used inside <JobFiltersProvider>.');
  }
  return context;
}
