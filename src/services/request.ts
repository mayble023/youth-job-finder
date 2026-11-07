import { AppError } from '@/utils/errors';

export type DataErrorKind =
  'network' | 'timeout' | 'not_found' | 'duplicate' | 'too_large' | 'unauthorized' | 'unknown';

export type DataError = AppError<DataErrorKind>;

const REQUEST_TIMEOUT_MS = 15_000;

const FRIENDLY_MESSAGES: Record<DataErrorKind, string> = {
  network: 'No internet connection. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  not_found: 'We could not find what you were looking for. It may have been removed.',
  duplicate: 'This has already been saved.',
  too_large: 'That file is too big to upload.',
  unauthorized: 'Your session has expired. Please log in again.',
  unknown: 'Something went wrong. Please try again.',
};

export function dataError(kind: DataErrorKind, message = FRIENDLY_MESSAGES[kind]): DataError {
  return new AppError(kind, message);
}

/** The shape shared by Supabase database (Postgrest) and Storage errors. */
type SupabaseError = {
  message: string;
  code?: string;
  status?: number;
  statusCode?: string | number;
};

function classifySupabaseError(error: SupabaseError): DataErrorKind {
  // Storage reports HTTP status codes rather than Postgres codes.
  const status = Number(error.statusCode ?? error.status);
  if (status === 413) return 'too_large';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not_found';

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

type QueryResult<T> = { data: T | null; error: SupabaseError | null };

type QueryOptions = {
  /** Uploads need longer than the 15-second default on slow mobile data. */
  timeoutMs?: number;
};

/**
 * Runs a Supabase call with a timeout (15 seconds by default) and turns every failure into
 * a DataError with a user-friendly message. `externalSignal` is React Query's signal, so
 * leaving a screen cancels its request too.
 */
export async function runQuery<T>(
  build: (signal: AbortSignal) => PromiseLike<QueryResult<T>>,
  externalSignal?: AbortSignal,
  options: QueryOptions = {},
): Promise<T | null> {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Racing a timer (not just aborting) also covers calls that ignore the abort signal,
  // such as Storage uploads.
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(dataError('timeout'));
    }, options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  });
  const forwardAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', forwardAbort);

  try {
    const { data, error } = await Promise.race([
      Promise.resolve(build(controller.signal)),
      timeout,
    ]);
    if (error) {
      // Supabase reports an aborted fetch as an error result rather than throwing.
      if (timedOut) throw dataError('timeout');
      if (error.message?.includes('Network request failed')) throw dataError('network');
      throw dataError(classifySupabaseError(error));
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
