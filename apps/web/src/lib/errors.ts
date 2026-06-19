/**
 * errors.ts — AppError classes + a single normalize/adapt surface so the whole app
 * speaks ONE error shape (ARCHITECTURE.md §4: "one error handler shape").
 *
 * Two failure styles coexist by design:
 *  - Services return `Result<T>` (from @travela/shared) for EXPECTED failures and
 *    use the `err(code, message, extra)` constructor. The helpers here produce the
 *    `extra` payload: `zodToApiError` (field errors) and `toApiError` (cause).
 *  - Repositories THROW `RepositoryError` for DB-layer faults; services catch and
 *    convert to a Result via `toApiError`. Route handlers use `normalizeError` /
 *    `statusForError` to turn any throw into the shared `ApiError` + HTTP status.
 *
 * The `err()` extra argument is `Pick<ApiError,'fields'|'cause'>`, so both helpers
 * return that shape and slot directly into `err('CODE', 'msg', helper(...))`.
 */
import {
  type ApiError,
  type ApiErrorCode,
  err,
  httpStatusForError,
} from '@travela/shared';
import { z } from 'zod';
import { logger } from './logger.js';

/* ── Error classes ───────────────────────────────────────────────────────────── */

/** Base application error carrying a machine-readable ApiErrorCode. */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string[]>;
  override readonly cause?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { fields?: Record<string, string[]>; cause?: unknown },
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.fields = options?.fields;
    this.cause = options?.cause;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', fields?: Record<string, string[]>) {
    super('VALIDATION', message, { fields });
  }
}
export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHENTICATED', message);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this resource') {
    super('FORBIDDEN', message);
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super('NOT_FOUND', message);
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict', code: ApiErrorCode = 'CONFLICT') {
    super(code, message);
  }
}

/**
 * RepositoryError — thrown by *.repository.ts when a DB/Supabase call fails. Carries
 * the underlying cause for logging; never serialized to clients verbatim. Services
 * catch this and map it to a Result with `toApiError`.
 */
export class RepositoryError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super('INTERNAL', message, { cause: options?.cause });
  }
}

/* ── Adapters returning the `err()` extra payload ────────────────────────────── */

/**
 * Convert a ZodError into the field-error map consumed as the `err(...)` extra:
 *   err('VALIDATION', 'msg', zodToApiError(parsed.error))
 */
export function zodToApiError(
  error: z.ZodError,
): Pick<ApiError, 'fields'> {
  return { fields: error.flatten().fieldErrors as Record<string, string[]> };
}

/**
 * Adapt any thrown value into the `err(...)` extra (`{ cause }`), logging the
 * underlying detail so the request path stays console.log-free:
 *   err('INTERNAL', 'msg', toApiError(e))
 */
export function toApiError(error: unknown): Pick<ApiError, 'cause'> {
  logger.error('Service caught error', {
    error: error instanceof Error ? error.message : String(error),
  });
  return { cause: error };
}

/* ── Normalization for the throw-based HTTP boundary ─────────────────────────── */

/** Map any thrown value to a consistent ApiError (route handlers). */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, fields: error.fields };
  }
  if (error instanceof z.ZodError) {
    return {
      code: 'VALIDATION',
      message: 'Validation failed',
      fields: error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  logger.error('Unhandled error normalized to INTERNAL', {
    error: error instanceof Error ? error.message : String(error),
  });
  return { code: 'INTERNAL', message: 'Something went wrong. Please try again.' };
}

/** Normalize then wrap into the Result `Err` envelope (route handlers). */
export function toErrResult(error: unknown) {
  const normalized = normalizeError(error);
  return err(normalized.code, normalized.message, { fields: normalized.fields });
}

/** HTTP status for a normalized error (used by route handlers). */
export function statusForError(error: unknown): number {
  return httpStatusForError[normalizeError(error).code];
}
