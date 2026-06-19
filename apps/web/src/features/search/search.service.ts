/**
 * search.service.ts — search business logic (no Supabase, no req/res).
 *
 * Validates+normalizes search params, calls the repository, and maps rows → DTOs.
 * Reuses the listings feature's card-composition path (composeListingCards) so card
 * cover/rating batching lives in exactly one place (DRY, ARCHITECTURE.md reuse rule).
 * Returns Result<Paginated<ListingCardDTO>> / Result<CollectionBandDTO[]>.
 */
import {
  ok,
  err,
  type ListingCardDTO,
  type Paginated,
  type Result,
  type SearchParams,
} from '@nibash/shared';
import { toApiError } from '@/lib/errors';
import { composeListingCards } from '@/features/listings';
import * as repo from './search.repository.js';

/** A home/search collection band: its meta + the cards in it. */
export interface CollectionBandDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  listings: ListingCardDTO[];
}

/** Map validated SearchParams → the repository's normalized filter shape. */
function toFilters(params: SearchParams): repo.SearchFilters {
  return {
    location: params.location,
    division: params.division,
    district: params.district,
    area: params.area,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    category: params.category,
    placeType: params.placeType,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  };
}

/** Run a search and return a paginated page of listing cards. */
export async function searchListings(
  params: SearchParams,
): Promise<Result<Paginated<ListingCardDTO>>> {
  try {
    const { rows, total } = await repo.searchListings(toFilters(params));
    const items = await composeListingCards(rows);
    const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
    return ok({
      items,
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
    });
  } catch (e) {
    return err('INTERNAL', 'Could not run your search', toApiError(e));
  }
}

/** Curated collection bands with their listing cards (home page). */
export async function getCollections(
  perCollection = 12,
): Promise<Result<CollectionBandDTO[]>> {
  try {
    const bands = await repo.getCollectionsWithListings(perCollection);
    const out = await Promise.all(
      bands.map(async (b) => ({
        id: b.collection.id,
        name: b.collection.name,
        slug: b.collection.slug,
        description: b.collection.description,
        listings: await composeListingCards(b.rows),
      })),
    );
    return ok(out);
  } catch (e) {
    return err('INTERNAL', 'Could not load collections', toApiError(e));
  }
}
