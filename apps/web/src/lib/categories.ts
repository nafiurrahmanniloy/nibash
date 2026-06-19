/**
 * categories.ts — listing-type slug ⇄ enum helpers, shared by the nav, footer, and
 * the browse routes (/apartments, /rooms/dhaka, …). One place so the URL vocabulary
 * stays consistent (mirrors the real Nibash browse-by-type model).
 */
import type { ListingCategory } from '@nibash/shared';

/** Plural URL slug → singular DB category enum. */
export const CATEGORY_BY_SLUG = {
  apartments: 'apartment',
  rooms: 'room',
  hotels: 'hotel',
  resorts: 'resort',
  villas: 'villa',
  studios: 'studio',
} as const satisfies Record<string, ListingCategory>;

export type CategorySlug = keyof typeof CATEGORY_BY_SLUG;

/** Display labels per category (singular + plural). */
export const CATEGORY_LABEL: Record<ListingCategory, { one: string; many: string }> = {
  apartment: { one: 'Apartment', many: 'Apartments' },
  room: { one: 'Room', many: 'Rooms' },
  hotel: { one: 'Hotel', many: 'Hotels' },
  resort: { one: 'Resort', many: 'Resorts' },
  villa: { one: 'Villa', many: 'Villas' },
  studio: { one: 'Studio', many: 'Studios' },
};

/** Header nav order (matches the real site: Apartments · Rooms · Hotels). */
export const NAV_CATEGORY_SLUGS: CategorySlug[] = ['apartments', 'rooms', 'hotels'];

export function slugToCategory(slug: string): ListingCategory | null {
  return slug in CATEGORY_BY_SLUG ? CATEGORY_BY_SLUG[slug as CategorySlug] : null;
}

/** Turn a location URL slug into a search filter term (and a display name). */
export function locationFromSlug(slug: string): { query: string; label: string } {
  const special: Record<string, { query: string; label: string }> = {
    'coxs-bazar': { query: 'Cox', label: 'Cox’s Bazar' },
    'saint-martins': { query: 'Saint Martin', label: 'Saint Martin’s' },
  };
  if (slug in special) return special[slug]!;
  const label = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { query: label, label };
}

/** Make a location URL slug from a free-text query/name (footer + hub links). */
export function locationToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/’|'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
