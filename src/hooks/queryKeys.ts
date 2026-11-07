import type { JobFilters } from '@/services/jobs';

/** One place for cache keys, so invalidating "all job lists" cannot miss a spelling. */
export const queryKeys = {
  jobs: ['jobs'] as const,
  jobLists: () => [...queryKeys.jobs, 'list'] as const,
  jobList: (filters: JobFilters) => [...queryKeys.jobLists(), filters] as const,
  job: (id: string) => [...queryKeys.jobs, 'detail', id] as const,
  offlineJobList: ['offlineJobList'] as const,
  savedJobs: ['savedJobs'] as const,
  applications: ['applications'] as const,
  applicationList: () => [...queryKeys.applications, 'list'] as const,
  application: (id: string) => [...queryKeys.applications, 'detail', id] as const,
  applicationForJob: (jobId: string) => [...queryKeys.applications, 'forJob', jobId] as const,
};
