// Row types matching supabase/migrations/001_schema.sql.
// Dates come back from Supabase as ISO strings.

export const JOB_CATEGORIES = [
  'Administration',
  'Agriculture',
  'Construction',
  'Education',
  'Engineering',
  'Finance',
  'Health',
  'Hospitality',
  'IT',
  'Mining',
  'Retail',
  'Transport',
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Graduate',
  'Casual',
  'Volunteer',
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const APPLICATION_STATUSES = ['applied', 'interviewing', 'offered', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Profile {
  id: string;
  full_name: string | null;
  town: string | null;
  education: string | null;
  skills: string[];
  cv_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  category: JobCategory;
  job_type: JobType;
  town: string;
  latitude: number | null;
  longitude: number | null;
  /** PGK per year */
  salary_min: number | null;
  /** PGK per year */
  salary_max: number | null;
  description: string | null;
  requirements: string | null;
  tags: string[];
  /** YYYY-MM-DD */
  closing_date: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  /** 20–1000 characters */
  cover_note: string;
  interview_at: string | null;
  /** max 1000 characters */
  notes: string | null;
  created_at: string;
  updated_at: string;
}
