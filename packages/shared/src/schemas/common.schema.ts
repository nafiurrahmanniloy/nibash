/**
 * common.schema.ts — primitives reused across feature schemas:
 * pagination, money (BDT), id/date helpers.
 *
 * Money rule (design.md §5 / BUILD-PLAN): BDT, whole taka (no decimals/minor units),
 * non-negative, integer. Formatting (৳, thousands separators, Asia/Dhaka) is a UI
 * concern — these schemas validate the numeric contract only.
 */
import { z } from 'zod';

/** UUID v4 id used throughout. */
export const idSchema = z.string().uuid();

/** ISO-8601 datetime string (PostgREST timestamps). */
export const isoDateTimeSchema = z.string().datetime({ offset: true });

/** Bare calendar date `YYYY-MM-DD`. */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date');

/**
 * BDT money amount — whole taka, integer, ≥ 0. The platform stores prices as
 * whole taka (no paisa) for v1.
 */
export const moneySchema = z
  .number()
  .int('Amount must be a whole number of taka')
  .nonnegative('Amount cannot be negative');
export type Money = z.infer<typeof moneySchema>;

/** Currency code is fixed for v1. */
export const CURRENCY = 'BDT' as const;
export type Currency = typeof CURRENCY;

/** Pagination request params (page is 1-based). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type Pagination = z.infer<typeof paginationSchema>;

/** Generic paginated envelope. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Build a typed paginated-response schema for any item schema. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
