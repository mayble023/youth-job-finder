const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * An error whose message is safe to show to the user. Services throw these so screens can
 * show the message as-is and branch on `kind` (e.g. offer "Retry" only for network errors).
 */
export class AppError<TKind extends string = string> extends Error {
  readonly kind: TKind;

  constructor(kind: TKind, message: string) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
  }
}

export function getErrorKind(error: unknown): string | undefined {
  return error instanceof AppError ? error.kind : undefined;
}

/** Never shows raw library errors, which can be technical or leak details. */
export function getErrorMessage(error: unknown): string {
  return error instanceof AppError ? error.message : DEFAULT_MESSAGE;
}
