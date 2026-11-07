import type { JobFilters } from '@/services/jobs';

/** One place for cache keys, so invalidating "all job lists" cannot miss a spelling. */
export const queryKeys = {
  jobs: ['jobs'] as const,
  jobLists: () => [...queryKeys.jobs, 'list'] as const,
  jobList: (filters: JobFilters) => [...queryKeys.jobLists(), filters] as const,
  job: (id: string) => [...queryKeys.jobs, 'detail', id] as const,
  offlineJobList: ['offlineJobList'] as const,
  savedJobs: ['savedJobs'] as const,
};
