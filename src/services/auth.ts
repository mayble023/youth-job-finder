import { isAuthError, isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';

import { AppError } from '@/utils/errors';

import { supabase } from './supabase';

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_exists'
  | 'invalid_code'
  | 'weak_password'
  | 'same_password'
  | 'rate_limited'
  | 'network'
  | 'unknown';

type AuthAppError = AppError<AuthErrorKind>;

const FRIENDLY_MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please confirm your email first. We can send you a new code.',
  user_exists: 'An account with this email already exists. Try logging in instead.',
  invalid_code: 'That code is wrong or has expired. Check your email or request a new code.',
  weak_password: 'That password is too weak. Use at least 8 characters including a number.',
  same_password: 'Your new password must be different from your old one.',
  rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
  network: 'No internet connection. Check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
};

function classify(error: unknown): AuthErrorKind {
  // A failed fetch (offline, DNS, timeout) surfaces as a TypeError or a retryable fetch error.
  if (isAuthRetryableFetchError(error) || error instanceof TypeError) return 'network';
  if (!isAuthError(error)) return 'unknown';

  switch (error.code) {
    case 'invalid_credentials':
      return 'invalid_credentials';
    case 'email_not_confirmed':
      return 'email_not_confirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'user_exists';
    case 'otp_expired':
      return 'invalid_code';
    case 'weak_password':
      return 'weak_password';
    case 'same_password':
      return 'same_password';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rate_limited';
    default:
      return error.status === 429 ? 'rate_limited' : 'unknown';
  }
}

function toAppError(error: unknown): AuthAppError {
  const kind = classify(error);
  return new AppError<AuthErrorKind>(kind, FRIENDLY_MESSAGES[kind]);
}

/** Runs a Supabase auth call and turns any failure into an AppError. */
async function run<R extends { data: unknown; error: unknown }>(
  call: () => Promise<R>,
): Promise<R['data']> {
  let result: R;
  try {
    result = await call();
  } catch (thrown) {
    throw toAppError(thrown);
  }
  if (result.error) throw toAppError(result.error);
  return result.data;
}

export async function getSession(): Promise<Session | null> {
  const data = await run(() => supabase.auth.getSession());
  return data.session;
}

/** Subscribes to sign-in, sign-out and token refresh events. Returns an unsubscribe function. */
export function onSessionChange(listener: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}

export async function signUp(params: { email: string; password: string; fullName: string }) {
  const data = await run(() =>
    supabase.auth.signUp({
      email: params.email,
      password: params.password,
      // Read by the on_auth_user_created trigger to fill profiles.full_name.
      options: { data: { full_name: params.fullName } },
    }),
  );
  // With email confirmation on, Supabase hides whether an email is taken by returning a
  // user with no identities instead of an error.
  if (data.user && data.user.identities?.length === 0) {
    throw new AppError<AuthErrorKind>('user_exists', FRIENDLY_MESSAGES.user_exists);
  }
}

export async function verifySignupCode(params: { email: string; code: string }) {
  await run(() =>
    supabase.auth.verifyOtp({ email: params.email, token: params.code, type: 'email' }),
  );
}

export async function resendSignupCode(email: string) {
  await run(() => supabase.auth.resend({ type: 'signup', email }));
}

export async function signIn(params: { email: string; password: string }) {
  await run(() => supabase.auth.signInWithPassword(params));
}

export async function signOut() {
  await run(async () => {
    const { error } = await supabase.auth.signOut();
    return { data: null, error };
  });
}

export async function sendPasswordResetCode(email: string) {
  await run(() => supabase.auth.resetPasswordForEmail(email));
}

/**
 * Verifying the recovery code signs the user in; the new password is then set on that session.
 * If setting the password fails we sign out again, so nobody is left signed in with the old one.
 */
export async function resetPasswordWithCode(params: {
  email: string;
  code: string;
  newPassword: string;
}) {
  await run(() =>
    supabase.auth.verifyOtp({ email: params.email, token: params.code, type: 'recovery' }),
  );
  try {
    await run(() => supabase.auth.updateUser({ password: params.newPassword }));
  } catch (error) {
    await supabase.auth.signOut({ scope: 'local' });
    throw error;
  }
}
