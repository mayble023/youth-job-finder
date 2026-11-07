import { z } from 'zod';

import { APPLICATION_STATUSES } from '@/types/database';

// Same limits as the database CHECK constraints in 001_schema.sql.
export const COVER_NOTE_MIN = 20;
export const COVER_NOTE_MAX = 1000;
export const NOTES_MAX = 1000;

export const applySchema = z.object({
  coverNote: z
    .string()
    .trim()
    .min(COVER_NOTE_MIN, {
      error: `Write at least ${COVER_NOTE_MIN} characters about why you suit this job.`,
    })
    .max(COVER_NOTE_MAX, { error: `Keep your cover note under ${COVER_NOTE_MAX} characters.` }),
});

export const editApplicationSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES, { error: 'Choose a status.' }),
    interviewAt: z.date().nullable(),
    notes: z
      .string()
      .trim()
      .max(NOTES_MAX, { error: `Keep your notes under ${NOTES_MAX} characters.` }),
  })
  .superRefine((values, context) => {
    if (values.status !== 'interviewing') return;
    if (!values.interviewAt) {
      context.addIssue({
        code: 'custom',
        path: ['interviewAt'],
        message: 'Choose the date and time of your interview.',
      });
    } else if (values.interviewAt.getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        path: ['interviewAt'],
        message: 'The interview time must be in the future.',
      });
    }
  });
