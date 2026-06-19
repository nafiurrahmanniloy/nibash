/**
 * listings.repository.ts — the ONLY listings-feature Supabase seam.
 *
 * RLS-aware reads against `listings` and its relations. Every query selects
 * EXPLICIT columns (never `*`) so host-private/internal fields (e.g. `address`)
 * are never even fetched into the server. Returns raw row types; the service maps
 * them to DTOs. No DTO shaping, no business rules here.
 */
import type {
  Amenity,
  Listing,
  ListingImage,
  Profile,
} from '@travela/shared';
import { createServerSupabase } from '@/lib/supabase/server';
import { RepositoryError } from '@/lib/errors';
import { DEMO_MODE } from '@/lib/demo/flag';
import * as demo from '@/lib/demo/data';

/** Columns of `listings` that are safe to read for the public detail view. */
const LISTING_PUBLIC_COLUMNS =
  'id, host_id, title, slug, description, place_type, category, status, division, district, area, lat, lng, max_guests, bedrooms, beds, baths, price_per_day, min_nights, rules, created_at, updated_at';

/** Public listing row WITHOUT host-private `address` (never selected). */
export type PublicListingRow = Omit<Listing, 'address'>;

/** Aggregate rating computed for a listing. */
export interface ListingRatingRow {
  average: number;
  count: number;
}

/** Get a single published listing by slug (null if not found / not published). */
export async function getPublishedListingBySlug(
  slug: string,
): Promise<PublicListingRow | null> {
  if (DEMO_MODE) return demo.demoListingBySlug(slug);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_PUBLIC_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

/** Newest published listings (for the home "New arrivals" grid). */
export async function listNewArrivals(limit: number): Promise<PublicListingRow[]> {
  if (DEMO_MODE) return demo.demoNewArrivals(limit);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_PUBLIC_COLUMNS)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data ?? [];
}

/** Ordered gallery images for a listing (cover first, then sort_order). */
export async function getListingImages(listingId: string): Promise<ListingImage[]> {
  if (DEMO_MODE) return demo.demoImagesFor(listingId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('listing_images')
    .select('id, listing_id, url, sort_order, is_cover, created_at')
    .eq('listing_id', listingId)
    .order('is_cover', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data ?? [];
}

/** Cover image URLs for a set of listings, keyed by listing id (for card grids). */
export async function getCoverImageMap(
  listingIds: string[],
): Promise<Record<string, string>> {
  if (listingIds.length === 0) return {};
  if (DEMO_MODE) return demo.demoCoverMap(listingIds);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('listing_images')
    .select('listing_id, url, is_cover, sort_order')
    .in('listing_id', listingIds)
    .order('is_cover', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw new RepositoryError(error.message, { cause: error });

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    // First row per listing wins (cover, then lowest sort_order).
    if (!(row.listing_id in map)) map[row.listing_id] = row.url;
  }
  return map;
}

/** Amenities attached to a listing (joined through listing_amenities). */
export async function getListingAmenities(listingId: string): Promise<Amenity[]> {
  if (DEMO_MODE) return demo.demoAmenitiesFor(listingId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('listing_amenities')
    .select('amenity_id, amenities(id, name, icon_url, category)')
    .eq('listing_id', listingId);
  if (error) throw new RepositoryError(error.message, { cause: error });

  // PostgREST returns the joined amenity nested under `amenities`.
  const rows = (data ?? []) as unknown as Array<{ amenities: Amenity | null }>;
  return rows
    .map((r) => r.amenities)
    .filter((a): a is Amenity => a !== null);
}

/** Compact host profile for the listing host card (public-safe columns only). */
export async function getHostCard(hostId: string): Promise<Profile | null> {
  if (DEMO_MODE) return demo.demoHost(hostId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, avatar_url, phone, role, languages, identity_verified, bio, created_at, updated_at',
    )
    .eq('id', hostId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message, { cause: error });
  return data;
}

/** Aggregate rating (avg + count) for a listing from its reviews. */
export async function getListingRating(listingId: string): Promise<ListingRatingRow> {
  if (DEMO_MODE) return demo.demoRating(listingId);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('listing_id', listingId);
  if (error) throw new RepositoryError(error.message, { cause: error });

  const ratings = (data ?? []).map((r) => r.rating);
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((acc, n) => acc + n, 0);
  return { average: sum / ratings.length, count: ratings.length };
}

/** Ratings for many listings at once (for card grids), keyed by listing id. */
export async function getRatingMap(
  listingIds: string[],
): Promise<Record<string, ListingRatingRow>> {
  if (listingIds.length === 0) return {};
  if (DEMO_MODE) return demo.demoRatingMap(listingIds);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('reviews')
    .select('listing_id, rating')
    .in('listing_id', listingIds);
  if (error) throw new RepositoryError(error.message, { cause: error });

  const acc: Record<string, { sum: number; count: number }> = {};
  for (const row of data ?? []) {
    const bucket = acc[row.listing_id] ?? { sum: 0, count: 0 };
    bucket.sum += row.rating;
    bucket.count += 1;
    acc[row.listing_id] = bucket;
  }
  const out: Record<string, ListingRatingRow> = {};
  for (const [id, { sum, count }] of Object.entries(acc)) {
    out[id] = { average: count ? sum / count : 0, count };
  }
  return out;
}
