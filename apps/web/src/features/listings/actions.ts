'use server';
/**
 * actions.ts — listings server actions (THIN controllers).
 * Validate input, call ONE service function, return the DTO Result.
 */
import { z } from 'zod';
import {
  err,
  type ListingCardDTO,
  type ListingPublicDTO,
  type Result,
} from '@travela/shared';
import { zodToApiError } from '@/lib/errors';
import * as service from './listings.service.js';

const slugSchema = z
  .string()
  .trim()
  .min(1, 'A listing slug is required')
  .max(200)
  .regex(/^[a-z0-9-]+$/, 'Invalid listing slug');

const newArrivalsInputSchema = z
  .object({ limit: z.coerce.number().int().min(1).max(48).default(12) })
  .strict();

export async function getListingDetail(
  slug: unknown,
): Promise<Result<ListingPublicDTO>> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return err('VALIDATION', 'Invalid listing', zodToApiError(parsed.error));
  }
  return service.getListingDetail(parsed.data);
}

export async function getNewArrivals(
  input?: unknown,
): Promise<Result<ListingCardDTO[]>> {
  const parsed = newArrivalsInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return err('VALIDATION', 'Invalid request', zodToApiError(parsed.error));
  }
  return service.getNewArrivals(parsed.data.limit);
}
