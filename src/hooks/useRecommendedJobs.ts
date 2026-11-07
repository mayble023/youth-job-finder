import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { EMPTY_JOB_FILTERS } from '@/services/jobs';
import { getKnownCoordinatesWithoutPrompt } from '@/services/location';
import type { Job } from '@/types/database';
import { isJobClosed } from '@/utils/jobs';
import { scoreJob, type JobScore } from '@/utils/recommendations';

import { queryKeys } from './queryKeys';
import { useMyApplications } from './useApplications';
import { useJobs } from './useJobs';
import { useProfile } from './useProfile';

const MAX_RECOMMENDATIONS = 5;
// A recommendation needs at least one shared skill and a reasonable overall score.
const MIN_SCORE = 20;

export type RecommendedJob = { job: Job } & JobScore;

export type RecommendationStatus = 'loading' | 'noSkills' | 'empty' | 'ready' | 'error';

/**
 * The top 5 open jobs for the user, scored on the phone from their profile (skills, town)
 * and, if location is already allowed, how close the job is. Jobs they have applied for
 * and closed jobs are left out.
 */
export function useRecommendedJobs() {
  const profile = useProfile();
  // Scored against every open job, not just the filtered list the user is browsing.
  const jobs = useJobs(EMPTY_JOB_FILTERS);
  const applications = useMyApplications();
  const location = useQuery({
    queryKey: queryKeys.knownLocation,
    queryFn: getKnownCoordinatesWithoutPrompt,
    networkMode: 'always',
    staleTime: 5 * 60_000,
  });

  const recommendations = useMemo<RecommendedJob[]>(() => {
    if (!profile.data || jobs.jobs.length === 0) return [];
    const appliedJobIds = new Set(applications.data?.map((application) => application.job_id));

    return jobs.jobs
      .filter((job) => !appliedJobIds.has(job.id) && !isJobClosed(job))
      .map((job) => ({ job, ...scoreJob(job, profile.data, location.data) }))
      .filter(
        (recommended) => recommended.score >= MIN_SCORE && recommended.matchedSkills.length > 0,
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          // On a tie, the job closing sooner is more urgent.
          (a.job.closing_date ?? '9999').localeCompare(b.job.closing_date ?? '9999'),
      )
      .slice(0, MAX_RECOMMENDATIONS);
  }, [profile.data, jobs.jobs, applications.data, location.data]);

  let status: RecommendationStatus;
  if (profile.data && profile.data.skills.length === 0) status = 'noSkills';
  else if (profile.isError || jobs.status === 'error' || jobs.status === 'offlineNoCache')
    status = 'error';
  else if (!profile.data || jobs.status === 'loading') status = 'loading';
  else status = recommendations.length > 0 ? 'ready' : 'empty';

  const retry = () => {
    void profile.refetch();
    void jobs.refetch();
  };

  return { status, recommendations, retry };
}
