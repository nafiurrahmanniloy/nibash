/**
 * api/index.ts — barrel for cross-platform API helpers.
 */
export {
  ok,
  err,
  isOk,
  isErr,
  mapResult,
  unwrap,
  httpStatusForError,
} from './result.js';
export type {
  Result,
  ApiResponse,
  Ok,
  Err,
  ApiError,
  ApiErrorCode,
} from './result.js';
