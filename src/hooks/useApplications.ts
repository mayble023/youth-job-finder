import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createApplication,
  deleteApplication,
  getApplication,
  getMyApplicationForJob,
  listMyApplications,
  updateApplication,
  type ApplicationUpdate,
  type ApplicationWithJob,
} from '@/services/applications';

import { queryKeys } from './queryKeys';

/**
 * All of the user's applications. The tab filters by status on the phone, so the counts on
 * every filter chip come from one request.
 */
export function useMyApplications() {
  return useQuery({
    queryKey: queryKeys.applicationList(),
    queryFn: ({ signal }) => listMyApplications({}, signal),
  });
}

export function useApplication(id: string) {
  const queryClient = useQueryClient();
  return useQuery<ApplicationWithJob>({
    queryKey: queryKeys.application(id),
    queryFn: ({ signal }) => getApplication(id, signal),
    // Show the row from the list straight away while the fresh copy loads.
    placeholderData: () =>
      queryClient
        .getQueryData<ApplicationWithJob[]>(queryKeys.applicationList())
        ?.find((application) => application.id === id),
  });
}

/** Whether the user has applied for a job, used for the "Already applied" state. */
export function useApplicationForJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applicationForJob(jobId ?? ''),
    queryFn: ({ signal }) => getMyApplicationForJob(jobId ?? '', signal),
    enabled: Boolean(jobId),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (_created, { jobId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationForJob(jobId) }),
      ]),
  });
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: ApplicationUpdate) => updateApplication(id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.application(id), updated);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationForJob(updated.job_id) }),
      ]);
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; jobId: string }) => deleteApplication(id),
    // The detail entry is left to expire on its own: removing it now would make the open
    // screen refetch and flash "not found" before it closes.
    onSuccess: (_result, { jobId }) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.applicationForJob(jobId) }),
      ]);
    },
  });
}
