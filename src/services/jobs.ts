import { format } from 'date-fns';

import type { Job, JobCategory, JobType } from '@/types/database';
import { getErrorKind } from '@/utils/errors';

import { dataError, runQuery } from './request';
import { supabase } from './supabase';

export type JobFilters = {
  search: string;
  category: JobCategory | null;
  jobType: JobType | null;
  town: string | null;
};

export const EMPTY_JOB_FILTERS: JobFilters = {
  search: '',
  category: null,
  jobType: null,
  town: null,
};

/**
 * PostgREST's `or` filter is a comma-separated mini-language, so a search containing
 * `,` `(` `)` or `*` could change the filter. `%` and `_` are LIKE wildcards. Strip them all.
 */
function sanitiseSearch(search: string): string {
  return search.replace(/[,()*%_\\:"]/g, ' ').trim();
}

/** Open jobs only (no closing date, or closing today or later), soonest closing first. */
export async function listJobs(filters: JobFilters, signal?: AbortSignal): Promise<Job[]> {
  const today = format(new Date(), 'yyyy-MM-dd');

  const jobs = await runQuery((timeoutSignal) => {
    let query = supabase
      .from('jobs')
      .select('*')
      .or(`closing_date.is.null,closing_date.gte.${today}`)
      .order('closing_date', { ascending: true, nullsFirst: false })
      .order('title', { ascending: true });

    const search = sanitiseSearch(filters.search);
    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
    }
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.jobType) query = query.eq('job_type', filters.jobType);
    if (filters.town) query = query.eq('town', filters.town);

    return query.abortSignal(timeoutSignal).overrideTypes<Job[], { merge: false }>();
  }, signal);
  return jobs ?? [];
}

export async function getJob(id: string, signal?: AbortSignal): Promise<Job> {
  const job = await runQuery(
    (timeoutSignal) =>
      supabase.from('jobs').select('*').eq('id', id).abortSignal(timeoutSignal).maybeSingle<Job>(),
    signal,
  );
  if (!job) throw dataError('not_found', 'This job is no longer available.');
  return job;
}

/** The signed-in user's saved jobs, most recently saved first. RLS limits rows to the owner. */
export async function listSavedJobs(signal?: AbortSignal): Promise<Job[]> {
  const rows = await runQuery(
    (timeoutSignal) =>
      supabase
        .from('saved_jobs')
        .select('created_at, job:jobs(*)')
        .order('created_at', { ascending: false })
        .abortSignal(timeoutSignal)
        .overrideTypes<{ created_at: string; job: Job | null }[], { merge: false }>(),
    signal,
  );
  return (rows ?? []).flatMap((row) => (row.job ? [row.job] : []));
}

export async function saveJob(jobId: string): Promise<void> {
  try {
    // user_id defaults to auth.uid() in the database, so the client cannot save for someone else.
    await runQuery((timeoutSignal) =>
      supabase.from('saved_jobs').insert({ job_id: jobId }).abortSignal(timeoutSignal),
    );
  } catch (error) {
    // Already saved (e.g. a double tap) is the outcome the user wanted.
    if (getErrorKind(error) === 'duplicate') return;
    throw error;
  }
}

export async function unsaveJob(jobId: string): Promise<void> {
  await runQuery((timeoutSignal) =>
    supabase.from('saved_jobs').delete().eq('job_id', jobId).abortSignal(timeoutSignal),
  );
}
