import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  JOB_CATEGORIES,
  JOB_TYPES,
  type Job,
  type JobCategory,
  type JobType,
} from '@/types/database';

import { EMPTY_JOB_FILTERS, type JobFilters } from './jobs';

// Versioned keys let a future release change the stored shape without reading stale data.
const JOB_LIST_KEY = 'yjf:v1:lastJobList';
const JOB_FILTERS_KEY = 'yjf:v1:jobFilters';

export type CachedJobList = {
  jobs: Job[];
  /** ISO timestamp of when the list was fetched. */
  savedAt: string;
};

/** Storage can hold anything (old versions, manual edits), so parse defensively. */
async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or unavailable disk only costs the offline copy; the app keeps working.
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function saveJobListCache(jobs: Job[]): Promise<void> {
  const entry: CachedJobList = { jobs, savedAt: new Date().toISOString() };
  await writeJson(JOB_LIST_KEY, entry);
}

export async function loadJobListCache(): Promise<CachedJobList | null> {
  const stored = await readJson(JOB_LIST_KEY);
  if (!isObject(stored) || !Array.isArray(stored.jobs) || typeof stored.savedAt !== 'string') {
    return null;
  }
  return { jobs: stored.jobs as Job[], savedAt: stored.savedAt };
}

export async function saveJobFilters(filters: JobFilters): Promise<void> {
  await writeJson(JOB_FILTERS_KEY, filters);
}

export async function loadJobFilters(): Promise<JobFilters> {
  const stored = await readJson(JOB_FILTERS_KEY);
  if (!isObject(stored)) return EMPTY_JOB_FILTERS;

  const { search, category, jobType, town } = stored;
  return {
    search: typeof search === 'string' ? search.slice(0, 100) : '',
    category: JOB_CATEGORIES.includes(category as JobCategory) ? (category as JobCategory) : null,
    jobType: JOB_TYPES.includes(jobType as JobType) ? (jobType as JobType) : null,
    town: typeof town === 'string' ? town : null,
  };
}

/** Drafts are keyed by user too, so someone else logging in on the phone never sees them. */
function applicationDraftKey(userId: string, jobId: string): string {
  return `yjf:v1:applicationDraft:${userId}:${jobId}`;
}

export async function loadApplicationDraft(userId: string, jobId: string): Promise<string> {
  const stored = await readJson(applicationDraftKey(userId, jobId));
  return typeof stored === 'string' ? stored : '';
}

export async function saveApplicationDraft(
  userId: string,
  jobId: string,
  coverNote: string,
): Promise<void> {
  if (coverNote.trim() === '') {
    await clearApplicationDraft(userId, jobId);
    return;
  }
  await writeJson(applicationDraftKey(userId, jobId), coverNote);
}

export async function clearApplicationDraft(userId: string, jobId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(applicationDraftKey(userId, jobId));
  } catch {
    // Leaving a stale draft behind is harmless; it is overwritten on the next save.
  }
}
