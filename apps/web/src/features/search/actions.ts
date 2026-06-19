'use server';
/**
 * actions.ts — search server actions (THIN controllers).
 * Parse params with searchParamsSchema (URL-friendly coercion), call ONE service fn.
 */
import { z } from 'zod';
import {
  searchParamsSchema,
  err,
  type ListingCardDTO,
  type Paginated,
  type Result,
} from '@travela/shared';
import { zodToApiError } from '@/lib/errors';
import * as service from './search.service.js';
import type { CollectionBandDTO } from './search.service.js';

export async function searchListings(
  rawParams: unknown,
): Promise<Result<Paginated<ListingCardDTO>>> {
  const parsed = searchParamsSchema.safeParse(rawParams ?? {});
  if (!parsed.success) {
    return err('VALIDATION', 'Invalid search filters', zodToApiError(parsed.error));
  }
  return service.searchListings(parsed.data);
}

const collectionsInputSchema = z
  .object({ perCollection: z.coerce.number().int().min(1).max(24).default(12) })
  .strict();

export async function getCollections(
  input?: unknown,
): Promise<Result<CollectionBandDTO[]>> {
  const parsed = collectionsInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return err('VALIDATION', 'Invalid request', zodToApiError(parsed.error));
  }
  return service.getCollections(parsed.data.perCollection);
}
