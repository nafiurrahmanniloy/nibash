/**
 * review.schema.ts — create-review input + public review DTO + aggregate.
 * A review is only valid against a completed booking (enforced in the service).
 */
import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './common.schema.js';

export const ratingSchema = z.number().int().min(1).max(5);

export const createReviewInputSchema = z
  .object({
    bookingId: idSchema,
    rating: ratingSchema,
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

/** Compact reviewer identity shown next to a review (never the full profile). */
export const reviewAuthorDTOSchema = z.object({
  id: idSchema,
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});
export type ReviewAuthorDTO = z.infer<typeof reviewAuthorDTOSchema>;

export const reviewDTOSchema = z.object({
  id: idSchema,
  listingId: idSchema,
  rating: ratingSchema,
  comment: z.string().nullable(),
  author: reviewAuthorDTOSchema,
  createdAt: isoDateTimeSchema,
});
export type ReviewDTO = z.infer<typeof reviewDTOSchema>;

/** Aggregate rating shown on listings and host profiles. */
export const ratingAggregateSchema = z.object({
  average: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
});
export type RatingAggregate = z.infer<typeof ratingAggregateSchema>;
