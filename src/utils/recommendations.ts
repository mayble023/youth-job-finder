import type { Job, Profile } from '@/types/database';

import { formatDistance, haversineKm, toPoint } from './distance';

type Coordinates = { latitude: number; longitude: number };

export type JobScore = {
  /** 0–100; higher is a better match. */
  score: number;
  /** Short, human-readable explanations, most important first. */
  reasons: string[];
  matchedSkills: string[];
};

/**
 * Points available for each signal (they add up to 100). Skills carry the most weight
 * because they say the most about whether someone can do the job.
 */
export const SCORE_WEIGHTS = {
  skills: 50,
  town: 20,
  entryLevel: 15,
  distance: 15,
} as const;

// Matching this many of a job's tags earns the full skills score.
const SKILLS_FOR_FULL_SCORE = 3;
// Jobs further away than this get no distance points.
const DISTANCE_LIMIT_KM = 100;

const ENTRY_LEVEL_POINTS: Partial<Record<Job['job_type'], number>> = {
  Internship: SCORE_WEIGHTS.entryLevel,
  Graduate: SCORE_WEIGHTS.entryLevel,
  'Part-time': SCORE_WEIGHTS.entryLevel / 2,
  Casual: SCORE_WEIGHTS.entryLevel / 2,
};

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Scores how well a job suits a young job seeker. Pure: no network, no AI, the same inputs
 * always give the same result, which makes it easy to test and to explain.
 */
export function scoreJob(
  job: Pick<Job, 'tags' | 'town' | 'job_type' | 'latitude' | 'longitude'>,
  profile: Pick<Profile, 'skills' | 'town'>,
  coordinates?: Coordinates | null,
): JobScore {
  const reasons: string[] = [];
  let score = 0;

  // Skills: the share of the job's tags the user has, capped so 3 matches is full marks.
  const userSkills = new Set(profile.skills.map(normalise));
  const matchedSkills = job.tags.filter((tag) => userSkills.has(normalise(tag)));
  if (matchedSkills.length > 0) {
    const needed = Math.min(SKILLS_FOR_FULL_SCORE, job.tags.length);
    score += SCORE_WEIGHTS.skills * Math.min(1, matchedSkills.length / needed);
    const list = matchedSkills.join(', ');
    reasons.push(
      matchedSkills.length === 1
        ? `Matches your skill: ${list}`
        : `Matches ${matchedSkills.length} of your skills: ${list}`,
    );
  }

  if (profile.town && normalise(profile.town) === normalise(job.town)) {
    score += SCORE_WEIGHTS.town;
    reasons.push(`In your town (${job.town})`);
  }

  const entryPoints = ENTRY_LEVEL_POINTS[job.job_type] ?? 0;
  if (entryPoints > 0) {
    score += entryPoints;
    reasons.push(
      entryPoints === SCORE_WEIGHTS.entryLevel
        ? `${job.job_type} role – made for people starting out`
        : `${job.job_type} – easy to fit around study`,
    );
  }

  const jobPoint = toPoint(job.latitude, job.longitude);
  if (coordinates && jobPoint) {
    const km = haversineKm(coordinates, jobPoint);
    if (km < DISTANCE_LIMIT_KM) {
      score += SCORE_WEIGHTS.distance * (1 - km / DISTANCE_LIMIT_KM);
      reasons.push(`${formatDistance(km)} from you`);
    }
  }

  return { score: Math.round(Math.min(100, score)), reasons, matchedSkills };
}
