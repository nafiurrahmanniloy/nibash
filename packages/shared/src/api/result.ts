/**
 * result.ts — the typed Result / ApiResponse helper used by services and returned
 * across the controller boundary.
 *
 * Services return `Result<T>` instead of throwing for expected failures (validation,
 * not-found, illegal-transition, unavailable). Controllers map a `Result` to an HTTP
 * response (or a server-action return). This keeps one error shape across the app
 * (ARCHITECTURE.md §4: "one error handler shape").
 */

/** Stable, machine-readable error codes shared by web + mobile. */
export type ApiErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT' // e.g. double-booking / overlapping range
  | 'ILLEGAL_TRANSITION' // booking state machine rejected the edge
  | 'UNAVAILABLE' // dates blocked / listing not bookable
  | 'PAYMENT_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Optional field-level details (e.g. from a zod flatten), keyed by field path. */
  fields?: Record<string, string[]>;
  /** Optional cause for logging (never serialized to clients verbatim). */
  cause?: unknown;
}

export interface Ok<T> {
  ok: true;
  data: T;
}

export interface Err {
  ok: false;
  error: ApiError;
}

/** Discriminated union: callers narrow on `result.ok`. */
export type Result<T> = Ok<T> | Err;

/** Alias used at the HTTP/action boundary. */
export type ApiResponse<T> = Result<T>;

/* ── Constructors ───────────────────────────────────────────────────────────── */

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });

export const err = (
  code: ApiErrorCode,
  message: string,
  extra?: Pick<ApiError, 'fields' | 'cause'>,
): Err => ({
  ok: false,
  error: { code, message, ...extra },
});

/* ── Guards ─────────────────────────────────────────────────────────────────── */

export const isOk = <T>(r: Result<T>): r is Ok<T> => r.ok;
export const isErr = <T>(r: Result<T>): r is Err => !r.ok;

/* ── Combinators ────────────────────────────────────────────────────────────── */

/** Map the success value; pass errors through untouched. */
export const mapResult = <T, U>(r: Result<T>, fn: (value: T) => U): Result<U> =>
  r.ok ? ok(fn(r.data)) : r;

/** Unwrap or throw — use only at trusted call sites (tests, scripts), not in services. */
export const unwrap = <T>(r: Result<T>): T => {
  if (r.ok) return r.data;
  throw new Error(`[${r.error.code}] ${r.error.message}`);
};

/** Default HTTP status for each error code (used by route handlers). */
export const httpStatusForError: Record<ApiErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  ILLEGAL_TRANSITION: 409,
  UNAVAILABLE: 409,
  PAYMENT_FAILED: 402,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};
