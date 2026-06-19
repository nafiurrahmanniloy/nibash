/**
 * listings.service.ts — listings business logic (no Supabase, no req/res).
 *
 * Composes a listing-detail DTO from its parts and produces card DTOs, never
 * leaking host-private/internal fields (mapping enforced by the zod DTO schemas in
 * listings.mappers). Returns Result<T> for expected failures (NOT_FOUND).
 */
import {
  ok,
  err,
  type ListingCardDTO,
  type ListingPublicDTO,
  type Result,
} from '@travela/shared';
import { toApiError } from '@/lib/errors';
import * as repo from './listings.repository.js';
import {
  toListingCardDTO,
  toListingPublicDTO,
  type ListingDetailParts,
} from './listings.mappers.js';

/** Build card DTOs for a set of public listing rows, batching cover + rating reads. */
async function toCards(
  listings: repo.PublicListingRow[],
): Promise<ListingCardDTO[]> {
  if (listings.length === 0) return [];
  const ids = listings.map((l) => l.id);
  const [covers, ratings] = await Promise.all([
    repo.getCoverImageMap(ids),
    repo.getRatingMap(ids),
  ]);
  return listings.map((l) =>
    toListingCardDTO(l, covers[l.id] ?? null, ratings[l.id] ?? { average: 0, count: 0 }),
  );
}

/** Compose a full public listing detail by slug. */
export async function getListingDetail(
  slug: string,
): Promise<Result<ListingPublicDTO>> {
  try {
    const listing = await repo.getPublishedListingBySlug(slug);
    if (!listing) return err('NOT_FOUND', 'Listing not found');

    const [images, amenities, host, rating] = await Promise.all([
      repo.getListingImages(listing.id),
      repo.getListingAmenities(listing.id),
      repo.getHostCard(listing.host_id),
      repo.getListingRating(listing.id),
    ]);
    if (!host) return err('NOT_FOUND', 'Listing host not found');

    const parts: ListingDetailParts = { listing, images, amenities, host, rating };
    return ok(toListingPublicDTO(parts));
  } catch (e) {
    return err('INTERNAL', 'Could not load this listing', toApiError(e));
  }
}

/** Newest published listings as card DTOs for the home grid. */
export async function getNewArrivals(
  limit = 12,
): Promise<Result<ListingCardDTO[]>> {
  try {
    const rows = await repo.listNewArrivals(limit);
    return ok(await toCards(rows));
  } catch (e) {
    return err('INTERNAL', 'Could not load new arrivals', toApiError(e));
  }
}

/** Exported for the search service to reuse the card-composition path (DRY). */
export { toCards as composeListingCards };
