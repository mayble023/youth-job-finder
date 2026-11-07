import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteCv, getCvInfo, pickCvFile, uploadCv, viewCv } from '@/services/cv';
import { getMyProfile, updateMyProfile, type ProfileUpdate } from '@/services/profile';
import type { Profile } from '@/types/database';

import { queryKeys } from './queryKeys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => getMyProfile(signal),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: ProfileUpdate) => updateMyProfile(changes),
    onSuccess: (updated) => queryClient.setQueryData<Profile>(queryKeys.profile, updated),
  });
}

/** Upload date of the user's CV; only fetched when the profile says there is one. */
export function useCvInfo(cvPath: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.cvInfo(cvPath ?? ''),
    queryFn: ({ signal }) => getCvInfo(cvPath ?? '', signal),
    enabled: Boolean(cvPath),
  });
}

/**
 * Picks a PDF and uploads it. Resolves to false if the user cancelled the picker, so the
 * screen can tell "nothing happened" apart from success.
 */
export function useUploadCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const file = await pickCvFile();
      if (!file) return false;
      await uploadCv(file);
      return true;
    },
    onSuccess: (uploaded) => {
      if (!uploaded) return;
      return queryClient.invalidateQueries({ queryKey: queryKeys.profileAndCv });
    },
  });
}

export function useViewCv() {
  return useMutation({ mutationFn: (cvPath: string) => viewCv(cvPath) });
}

export function useDeleteCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cvPath: string) => deleteCv(cvPath),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profileAndCv }),
  });
}
