/**
 * search.repository.ts — the ONLY search-feature Supabase seam.
 *
 * Builds the filtered listings query (location, dates→availability, guests, price,
 * category, place_type) with pagination, plus the collections-with-listings read.
 * Explicit columns only; returns raw rows + a total count. The service normalizes
 * params and maps rows → DTOs.
 *
 * Availability filtering: a listing is unavailable for [checkIn, checkOut) if it has
 * an overlapping availability_blocks row OR an overlapping confirmed booking. We read
 * the set of blocked listing ids for the requested range and exclude them
 * (BUILD-PLAN §3: "no overlapping availability_blocks AND no overlapping confirmed
 * booking").
 */
import type { Collection } from '@travela/shared';
import { createServerSupabase } from '@/lib/supabase/server';
import { RepositoryError } from '@/lib/errors';
import type { PublicListingRow } from '@/features/listings/listings.repository';

/** Same public-safe projection the listings repo uses (no `address`). */
const LISTING_PUBLIC_COLUMNS =
  'id, host_id, title, slug, description, place_type, category, status, division, district, area, lat, lng, max_guests, bedrooms, beds, baths, price_per_day, min_nights, rules, created_at, updated_at';

/** Normalized filter shape the service hands to the repository. */
export interface SearchFilters {
  location?: string;
  division?: string;
  district?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  placeType?: string;
  sort: 'recommended' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page: number;
  pageSize: number;
}

export interface SearchResultRows {
  rows: PublicListingRow[];
  total: number;
}

/** Listing ids with availability conflicts for the given half-open date range. */
async function getUnavailableListingIds(
  checkIn: string,
  checkOut: string,
): Promise<Set<string>> {
  const supabase = await createServerSupabase();
  const blocked = new Set<string>();

  // Overlap test for half-open ranges [start, end): start < checkOut AND end > checkIn.
  const [blocks, bookings] = await Promise.all([
    supabase
      .from('availability_blocks')
      .select('listing_id, start_date, end_date')
      .lt('start_date', checkOut)
      .gt('end_date', checkIn),
    supabase
      .from('bookings')
      .select('listing_id, check_in, check_out, status')
      .eq('status', 'confirmed')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn),
  ]);

  if (blocks.error) throw new RepositoryError(blocks.error.message, { cause: blocks.error });
  if (bookings.error)
    throw new RepositoryError(bookings.error.message, { cause: bookings.error });

  for (const b of blocks.data ?? []) blocked.add(b.listing_id);
  for (const b of bookings.data ?? []) blocked.add(b.listing_id);
  return blocked;
}

/** Run the filtered, paginated search over published listings. */
export async function searchListings(
  filters: SearchFilters,
): Promise<SearchResultRows> {
  const supabase = await createServerSupabase();

  let query = supabase
    .from('listings')
    .select(LISTING_PUBLIC_COLUMNS, { count: 'exact' })
    .eq('status', 'published');

  // Location filters — coarse geo + free-text fallback across area/district/division.
  if (filters.division) query = query.eq('division', filters.division);
  if (filters.district) query = query.eq('district', filters.district);
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.location) {
    const term = `%${filters.location}%`;
    query = query.or(
      `area.ilike.${term},district.ilike.${term},division.ilike.${term},title.ilike.${term}`,
    );
  }

  // Capacity + facets.
  if (filters.guests) query = query.gte('max_guests', filters.guests);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.placeType) query = query.eq('place_type', filters.placeType);

  // Price range (BDT whole taka).
  if (filters.minPrice !== undefined) query = query.gte('price_per_day', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('price_per_day', filters.maxPrice);

  // Date availability — exclude conflicting listings.
  if (filters.checkIn && filters.checkOut) {
    const unavailable = await getUnavailableListingIds(filters.checkIn, filters.checkOut);
    if (unavailable.size > 0) {
      query = query.not('id', 'in', `(${[...unavailable].join(',')})`);
    }
  }

  // Sort (rating sort is approximated by newest here; true rating sort is a future
  // materialized aggregate — kept honest rather than a fake column reference).
  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price_per_day', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_per_day', { ascending: false });
      break;
    case 'newest':
    case 'rating':
    case 'recommended':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination (1-based page → range).
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new RepositoryError(error.message, { cause: error });

  return { rows: (data ?? []) as unknown as PublicListingRow[], total: count ?? 0 };
}

/** A collection plus the listing rows it contains (ordered). */
export interface CollectionWithListings {
  collection: Collection;
  rows: PublicListingRow[];
}

/**
 * Fetch all collections with their published listings (for the home page bands).
 * `perCollection` caps how many listings each band shows.
 */
export async function getCollectionsWithListings(
  perCollection: number,
): Promise<CollectionWithListings[]> {
  const supabase = await createServerSupabase();

  const { data: collections, error: collErr } = await supabase
    .from('collections')
    .select('id, name, slug, description, sort_order, created_at')
    .order('sort_order', { ascending: true });
  if (collErr) throw new RepositoryError(collErr.message, { cause: collErr });
  if (!collections || collections.length === 0) return [];

  const results = await Promise.all(
    collections.map(async (collection) => {
      const { data, error } = await supabase
        .from('listing_collections')
        .select(
          `sort_order, listings!inner(${LISTING_PUBLIC_COLUMNS})`,
        )
        .eq('collection_id', collection.id)
        .eq('listings.status', 'published')
        .order('sort_order', { ascending: true })
        .limit(perCollection);
      if (error) throw new RepositoryError(error.message, { cause: error });

      const rows = ((data ?? []) as unknown as Array<{ listings: PublicListingRow | null }>)
        .map((r) => r.listings)
        .filter((l): l is PublicListingRow => l !== null);
      return { collection, rows };
    }),
  );

  // Only surface bands that actually have listings.
  return results.filter((r) => r.rows.length > 0);
}
