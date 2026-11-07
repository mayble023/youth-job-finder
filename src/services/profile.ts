import type { Profile } from '@/types/database';

import { getCurrentUserId } from './auth';
import { dataError, runQuery } from './request';
import { supabase } from './supabase';

export type ProfileUpdate = {
  fullName: string;
  town: string | null;
  education: string | null;
  skills: string[];
};

/** The signed-in user's profile row, created by a database trigger at sign-up. */
export async function getMyProfile(signal?: AbortSignal): Promise<Profile> {
  const userId = await getCurrentUserId();
  const profile = await runQuery(
    (timeoutSignal) =>
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(timeoutSignal)
        .maybeSingle<Profile>(),
    signal,
  );
  if (!profile) throw dataError('not_found', 'We could not find your profile.');
  return profile;
}

export async function updateMyProfile(changes: ProfileUpdate): Promise<Profile> {
  const userId = await getCurrentUserId();
  const updated = await runQuery((signal) =>
    supabase
      .from('profiles')
      .update({
        full_name: changes.fullName,
        town: changes.town,
        education: changes.education,
        skills: changes.skills,
      })
      .eq('id', userId)
      .select('*')
      .abortSignal(signal)
      .maybeSingle<Profile>(),
  );
  if (!updated) throw dataError('not_found', 'We could not find your profile.');
  return updated;
}

/** Records (or clears) the storage path of the user's CV. Never a local file URI. */
export async function setMyCvPath(cvPath: string | null): Promise<void> {
  const userId = await getCurrentUserId();
  await runQuery((signal) =>
    supabase.from('profiles').update({ cv_path: cvPath }).eq('id', userId).abortSignal(signal),
  );
}
