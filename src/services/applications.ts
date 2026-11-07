import type { Application, ApplicationStatus, Job } from '@/types/database';
import { getErrorKind } from '@/utils/errors';

import { dataError, runQuery } from './request';
import { supabase } from './supabase';

export type ApplicationJobSummary = Pick<Job, 'id' | 'title' | 'company' | 'town'>;

/** An application with the few job fields the list and detail screens show. */
export type ApplicationWithJob = Application & { job: ApplicationJobSummary | null };

const WITH_JOB = '*, job:jobs(id, title, company, town)';

export async function createApplication(params: {
  jobId: string;
  coverNote: string;
}): Promise<Application> {
  try {
    // user_id defaults to auth.uid() in the database, so it is never sent from the phone.
    const created = await runQuery((signal) =>
      supabase
        .from('applications')
        .insert({ job_id: params.jobId, cover_note: params.coverNote })
        .select('*')
        .abortSignal(signal)
        .single<Application>(),
    );
    if (!created) throw dataError('unknown');
    return created;
  } catch (error) {
    // The unique (user_id, job_id) constraint is the real guard against double submits.
    if (getErrorKind(error) === 'duplicate') {
      throw dataError('duplicate', 'You have already applied for this job.');
    }
    throw error;
  }
}

/** The signed-in user's applications, newest first. RLS returns only their own rows. */
export async function listMyApplications(
  options: { status?: ApplicationStatus } = {},
  signal?: AbortSignal,
): Promise<ApplicationWithJob[]> {
  const rows = await runQuery((timeoutSignal) => {
    let query = supabase
      .from('applications')
      .select(WITH_JOB)
      .order('created_at', { ascending: false });
    if (options.status) query = query.eq('status', options.status);
    return query.abortSignal(timeoutSignal).overrideTypes<ApplicationWithJob[], { merge: false }>();
  }, signal);
  return rows ?? [];
}

export async function getApplication(
  id: string,
  signal?: AbortSignal,
): Promise<ApplicationWithJob> {
  const application = await runQuery(
    (timeoutSignal) =>
      supabase
        .from('applications')
        .select(WITH_JOB)
        .eq('id', id)
        .abortSignal(timeoutSignal)
        .maybeSingle<ApplicationWithJob>(),
    signal,
  );
  if (!application) throw dataError('not_found', 'This application no longer exists.');
  return application;
}

export type ApplicationUpdate = {
  status: ApplicationStatus;
  /** ISO timestamp; only kept while the status is 'interviewing'. */
  interviewAt: string | null;
  notes: string | null;
};

export async function updateApplication(
  id: string,
  changes: ApplicationUpdate,
): Promise<ApplicationWithJob> {
  const updated = await runQuery((signal) =>
    supabase
      .from('applications')
      .update({
        status: changes.status,
        // An interview time only means something while the status is "interviewing".
        interview_at: changes.status === 'interviewing' ? changes.interviewAt : null,
        notes: changes.notes,
      })
      .eq('id', id)
      .select(WITH_JOB)
      .abortSignal(signal)
      .maybeSingle<ApplicationWithJob>(),
  );
  if (!updated) throw dataError('not_found', 'This application no longer exists.');
  return updated;
}

export async function deleteApplication(id: string): Promise<void> {
  await runQuery((signal) =>
    supabase.from('applications').delete().eq('id', id).abortSignal(signal),
  );
}

/** The user's application for one job, or null if they have not applied. */
export async function getMyApplicationForJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<Pick<Application, 'id' | 'status'> | null> {
  return runQuery(
    (timeoutSignal) =>
      supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', jobId)
        .abortSignal(timeoutSignal)
        .maybeSingle<Pick<Application, 'id' | 'status'>>(),
    signal,
  );
}
