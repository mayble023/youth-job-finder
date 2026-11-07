import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { listSavedJobs, saveJob, unsaveJob } from '@/services/jobs';
import type { Job } from '@/types/database';
import { getErrorMessage } from '@/utils/errors';

import { queryKeys } from './queryKeys';

export function useSavedJobs() {
  return useQuery({
    queryKey: queryKeys.savedJobs,
    queryFn: ({ signal }) => listSavedJobs(signal),
  });
}

/**
 * Saves or unsaves a job optimistically: the bookmark changes at once and is rolled back
 * (with a message) if the server rejects it.
 */
export function useToggleSavedJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ job, save }: { job: Job; save: boolean }) =>
      save ? saveJob(job.id) : unsaveJob(job.id),

    onMutate: async ({ job, save }) => {
      // Stop an in-flight fetch from overwriting the optimistic list.
      await queryClient.cancelQueries({ queryKey: queryKeys.savedJobs });
      const previous = queryClient.getQueryData<Job[]>(queryKeys.savedJobs);
      queryClient.setQueryData<Job[]>(queryKeys.savedJobs, (current = []) =>
        save
          ? [job, ...current.filter((saved) => saved.id !== job.id)]
          : current.filter((saved) => saved.id !== job.id),
      );
      return { previous };
    },

    onError: (error, { save }, context) => {
      queryClient.setQueryData(queryKeys.savedJobs, context?.previous);
      Alert.alert(save ? 'Could not save job' : 'Could not remove job', getErrorMessage(error));
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs }),
  });
}
