import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getJob, listJobs, type JobFilters } from '@/services/jobs';
import { loadJobListCache, saveJobListCache } from '@/services/localCache';
import type { Job } from '@/types/database';
import { filterJobsLocally } from '@/utils/jobs';

import { queryKeys } from './queryKeys';

export type OfflineJobList = { jobs: Job[]; savedAt: string };

/**
 * Open jobs matching `filters`. When the network fails (or React Query has paused because the
 * phone is offline) and there is no fresh data, `offlineList` holds the last list saved on the
 * phone, filtered the same way.
 */
export function useJobs(filters: JobFilters, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;

  const query = useQuery({
    queryKey: queryKeys.jobList(filters),
    queryFn: async ({ signal }) => {
      const jobs = await listJobs(filters, signal);
      void saveJobListCache(jobs);
      return jobs;
    },
    enabled,
  });

  const needsFallback =
    enabled && query.data === undefined && (query.isError || query.fetchStatus === 'paused');

  const cache = useQuery({
    queryKey: queryKeys.offlineJobList,
    queryFn: loadJobListCache,
    enabled: needsFallback,
    // Reading the phone's storage works offline, so never pause this one.
    networkMode: 'always',
    staleTime: 0,
  });

  const offlineList: OfflineJobList | null =
    needsFallback && cache.data
      ? { jobs: filterJobsLocally(cache.data.jobs, filters), savedAt: cache.data.savedAt }
      : null;

  let status: JobListStatus;
  if (query.data !== undefined) status = 'success';
  else if (offlineList) status = 'offline';
  else if (needsFallback && cache.isPending) status = 'loading';
  else if (query.isError) status = 'error';
  else if (query.fetchStatus === 'paused') status = 'offlineNoCache';
  else status = 'loading';

  return {
    status,
    jobs: query.data ?? offlineList?.jobs ?? [],
    offlineSavedAt: offlineList?.savedAt ?? null,
    error: query.error,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
}

export type JobListStatus = 'loading' | 'success' | 'offline' | 'offlineNoCache' | 'error';

/** One job. Shows the copy from any loaded list straight away while the full row loads. */
export function useJob(id: string) {
  const queryClient = useQueryClient();

  return useQuery<Job>({
    queryKey: queryKeys.job(id),
    queryFn: ({ signal }) => getJob(id, signal),
    placeholderData: () => {
      for (const [, jobs] of queryClient.getQueriesData<Job[]>({
        queryKey: queryKeys.jobLists(),
      })) {
        const match = jobs?.find((job) => job.id === id);
        if (match) return match;
      }
      return queryClient.getQueryData<Job[]>(queryKeys.savedJobs)?.find((job) => job.id === id);
    },
  });
}
