import { z } from 'zod';

export const SKILLS_MAX = 15;
export const SKILL_MIN_LENGTH = 2;
export const SKILL_MAX_LENGTH = 30;
export const EDUCATION_MAX = 120;

/** One skill tag. Stored lowercase so "Excel" and "excel" match job tags the same way. */
export const skillSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SKILL_MIN_LENGTH, { error: `A skill needs at least ${SKILL_MIN_LENGTH} characters.` })
  .max(SKILL_MAX_LENGTH, { error: `Keep each skill under ${SKILL_MAX_LENGTH} characters.` });

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: 'Your name must be at least 2 characters.' })
    .max(60, { error: 'Your name must be 60 characters or fewer.' }),
  town: z.string().nullable(),
  education: z
    .string()
    .trim()
    .max(EDUCATION_MAX, { error: `Keep this under ${EDUCATION_MAX} characters.` }),
  skills: z
    .array(skillSchema)
    .max(SKILLS_MAX, { error: `You can add up to ${SKILLS_MAX} skills.` })
    .refine((skills) => new Set(skills).size === skills.length, {
      error: 'Each skill can only be added once.',
    }),
});
