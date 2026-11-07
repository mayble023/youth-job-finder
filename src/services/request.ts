import type { PostgrestError } from '@supabase/supabase-js';

import { AppError } from '@/utils/errors';

export type DataErrorKind =
  'network' | 'timeout' | 'not_found' | 'duplicate' | 'unauthorized' | 'unknown';

export type DataError = AppError<DataErrorKind>;

const REQUEST_TIMEOUT_MS = 15_000;

const FRIENDLY_MESSAGES: Record<DataErrorKind, string> = {
  network: 'No internet connection. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  not_found: 'We could not find what you were looking for. It may have been removed.',
  duplicate: 'This has already been saved.',
  unauthorized: 'Your session has expired. Please log in again.',
  unknown: 'Something went wrong. Please try again.',
};

export function dataError(kind: DataErrorKind, message = FRIENDLY_MESSAGES[kind]): DataError {
  return new AppError(kind, message);
}

function classifyPostgrestError(error: PostgrestError): DataErrorKind {
  switch (error.code) {
    case '23505': // unique_violation
      return 'duplicate';
    case '22P02': // invalid_text_representation, e.g. a malformed uuid in the URL
    case 'PGRST116': // .single() found no row
      return 'not_found';
    case 'PGRST301': // JWT expired or invalid
    case '42501': // insufficient_privilege (RLS)
      return 'unauthorized';
    default:
      return 'unknown';
  }
}

type QueryResult<T> = { data: T | null; error: PostgrestError | null };

/**
 * Runs a Supabase query with a 15-second timeout and turns every failure into a DataError
 * with a user-friendly message. `externalSignal` is React Query's signal, so leaving a screen
 * cancels its request too.
 */
export async function runQuery<T>(
  build: (signal: AbortSignal) => PromiseLike<QueryResult<T>>,
  externalSignal?: AbortSignal,
): Promise<T | null> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', forwardAbort);

  try {
    const { data, error } = await build(controller.signal);
    if (error) {
      // Supabase reports an aborted fetch as an error result rather than throwing.
      if (timedOut) throw dataError('timeout');
      if (error.message?.includes('Network request failed')) throw dataError('network');
      throw dataError(classifyPostgrestError(error));
    }
    return data;
  } catch (thrown) {
    if (thrown instanceof AppError) throw thrown;
    if (timedOut) throw dataError('timeout');
    // fetch() rejects with a TypeError when there is no connection.
    if (thrown instanceof TypeError) throw dataError('network');
    throw dataError('unknown');
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', forwardAbort);
  }
}
