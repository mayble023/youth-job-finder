import { z } from 'zod';

// Supabase hashes passwords with bcrypt, which ignores anything after 72 bytes.
const PASSWORD_MAX = 72;
const EMAIL_MAX = 254;

const email = z
  .string()
  .trim()
  .min(1, { error: 'Enter your email address.' })
  .max(EMAIL_MAX, { error: 'That email address is too long.' })
  .pipe(z.email({ error: 'Enter a valid email address, like name@example.com.' }))
  .transform((value) => value.toLowerCase());

const newPassword = z
  .string()
  .min(8, { error: 'Use at least 8 characters.' })
  .max(PASSWORD_MAX, { error: `Use at most ${PASSWORD_MAX} characters.` })
  .regex(/\d/, { error: 'Include at least one number.' });

const confirmPassword = z.string().min(1, { error: 'Type your password again.' });

const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { error: 'Enter the 6-digit code from your email.' });

const passwordsMatch = {
  error: 'Passwords do not match.',
  path: ['confirmPassword'],
};

export const loginSchema = z.object({
  email,
  // Only check presence at login; the strength rules apply when a password is created.
  password: z.string().min(1, { error: 'Enter your password.' }),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { error: 'Your name must be at least 2 characters.' })
      .max(60, { error: 'Your name must be 60 characters or fewer.' }),
    email,
    password: newPassword,
    confirmPassword,
  })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch);

export const verifyCodeSchema = z.object({ code });

export const forgotPasswordEmailSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    code,
    password: newPassword,
    confirmPassword,
  })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch);
