/**
 * search.schema.ts — search/filter params for the marketplace (BUILD-PLAN §6).
 * Filters: location, date range, guests, price range, category, place_type.
 * Designed to parse straight from URLSearchParams (coercion-friendly).
 */
import { z } from 'zod';
import { dateStringSchema } from './common.schema.js';
import { listingCategorySchema, placeTypeSchema } from './listing.schema.js';

/** Inclusive-exclusive date range: check_in (inclusive) → check_out (exclusive). */
export const dateRangeSchema = z
  .object({
    checkIn: dateStringSchema,
    checkOut: dateStringSchema,
  })
  .refine((r) => r.checkOut > r.checkIn, {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });
export type DateRange = z.infer<typeof dateRangeSchema>;

/** Sort options for results. */
export const searchSortSchema = z
  .enum(['recommended', 'price_asc', 'price_desc', 'newest', 'rating'])
  .default('recommended');
export type SearchSort = z.infer<typeof searchSortSchema>;

/**
 * Search params. All filters optional. URL-friendly: strings coerce to numbers,
 * dates optional but validated together when both present.
 */
export const searchParamsSchema = z
  .object({
    // location (free text / coarse geo)
    location: z.string().trim().min(1).max(120).optional(),
    division: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    area: z.string().trim().max(120).optional(),
    // dates (both-or-neither)
    checkIn: dateStringSchema.optional(),
    checkOut: dateStringSchema.optional(),
    // guests
    guests: z.coerce.number().int().min(1).max(50).optional(),
    // price range (BDT whole taka)
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    // facets
    category: listingCategorySchema.optional(),
    placeType: placeTypeSchema.optional(),
    // sorting + paging
    sort: searchSortSchema,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(60).default(24),
  })
  .strict()
  .superRefine((v, ctx) => {
    if ((v.checkIn && !v.checkOut) || (!v.checkIn && v.checkOut)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide both check-in and check-out, or neither',
        path: ['checkOut'],
      });
    }
    if (v.checkIn && v.checkOut && v.checkOut <= v.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Check-out must be after check-in',
        path: ['checkOut'],
      });
    }
    if (
      v.minPrice !== undefined &&
      v.maxPrice !== undefined &&
      v.maxPrice < v.minPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Max price must be greater than or equal to min price',
        path: ['maxPrice'],
      });
    }
  });
export type SearchParams = z.infer<typeof searchParamsSchema>;
