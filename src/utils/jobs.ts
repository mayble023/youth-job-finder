import { format } from 'date-fns';

import type { Job } from '@/types/database';

type LocalJobFilters = {
  search: string;
  category: string | null;
  jobType: string | null;
  town: string | null;
};

/**
 * Applies the same filters as the server query to a list already on the phone, so the
 * offline (cached) list still respects what the user picked.
 */
export function filterJobsLocally(jobs: Job[], filters: LocalJobFilters): Job[] {
  const search = filters.search.trim().toLowerCase();
  return jobs.filter(
    (job) =>
      (!search ||
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search)) &&
      (!filters.category || job.category === filters.category) &&
      (!filters.jobType || job.job_type === filters.jobType) &&
      (!filters.town || job.town === filters.town),
  );
}

/** Closing dates are calendar days (YYYY-MM-DD), so compare them as strings in local time. */
export function isJobClosed(job: Pick<Job, 'closing_date'>, now = new Date()): boolean {
  return job.closing_date !== null && job.closing_date < format(now, 'yyyy-MM-dd');
}
