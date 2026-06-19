/**
 * demo/data.ts — in-memory fixture dataset + pure query helpers.
 *
 * This is the demo "database". When DEMO_MODE is on, the repository layer returns
 * data from here instead of querying Supabase — exactly the swappable-DB seam the
 * architecture exists for (ARCHITECTURE.md §1). Rows are in the SAME raw-row shapes
 * the real queries return, so services, pricing, DTO mapping, and the booking state
 * machine all run unchanged. No I/O here (no cookies, no Supabase) — pure data.
 *
 * Original content; images are generated placeholders (picsum.photos).
 */
import type {
  Amenity,
  Booking,
  Collection,
  ListingImage,
  Profile,
} from '@travela/shared';
import type { PublicListingRow } from '@/features/listings/listings.repository';
import type { SearchFilters, SearchResultRows } from '@/features/search/search.repository';

/** Build a syntactically-valid UUID from a short numeric tag (stable across runs). */
const uid = (tag: string) => `00000000-0000-4000-8000-${tag.padStart(12, '0')}`;
const img = (seed: string, i: number) =>
  `https://picsum.photos/seed/travela-${seed}-${i}/1024/768`;
const avatar = (seed: string) => `https://picsum.photos/seed/travela-host-${seed}/240/240`;

const T = '2026-06-10T09:00:00.000Z';

/** The signed-in demo user (host role so both guest and host surfaces are reachable). */
export const DEMO_USER: Profile = {
  id: uid('1'),
  full_name: 'Demo User',
  avatar_url: avatar('demo'),
  phone: '+8801700000000',
  role: 'host',
  languages: ['English', 'Bangla'],
  identity_verified: true,
  bio: 'Exploring stays across Bangladesh.',
  created_at: T,
  updated_at: T,
};

/* ── Hosts ─────────────────────────────────────────────────────────────────── */
const HOSTS: Profile[] = [
  {
    id: uid('11'),
    full_name: 'Ayesha Rahman',
    avatar_url: avatar('11'),
    phone: null,
    role: 'host',
    languages: ['English', 'Bangla'],
    identity_verified: true,
    bio: 'Superhost in Cox’s Bazar. I love helping guests find the sea.',
    created_at: T,
    updated_at: T,
  },
  {
    id: uid('12'),
    full_name: 'Tanvir Hasan',
    avatar_url: avatar('12'),
    phone: null,
    role: 'host',
    languages: ['English', 'Bangla', 'Hindi'],
    identity_verified: true,
    bio: 'City apartments in Dhaka, kept spotless and central.',
    created_at: T,
    updated_at: T,
  },
  {
    id: uid('13'),
    full_name: 'Niloy Chowdhury',
    avatar_url: avatar('13'),
    phone: null,
    role: 'host',
    languages: ['English', 'Bangla'],
    identity_verified: false,
    bio: 'Hill and tea-country hideaways in Sylhet and Bandarban.',
    created_at: T,
    updated_at: T,
  },
];

/* ── Listings (public row shape: no `address`) ─────────────────────────────── */
interface Seed {
  tag: string;
  hostTag: string;
  title: string;
  slug: string;
  description: string;
  place_type: PublicListingRow['place_type'];
  category: PublicListingRow['category'];
  division: string;
  district: string;
  area: string;
  lat: number;
  lng: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  price_per_day: number;
  min_nights: number;
  day: string; // created_at day suffix → controls "new arrivals" order
}

const SEEDS: Seed[] = [
  { tag: '101', hostTag: '11', title: 'Beachfront Villa in Cox’s Bazar', slug: 'beachfront-villa-coxs-bazar', description: 'Wake up to the Bay of Bengal from a private villa steps off Kolatoli beach. Sea-view terrace, full kitchen, and a quiet garden.', place_type: 'entire', category: 'villa', division: 'Chattogram', district: 'Cox’s Bazar', area: 'Kolatoli', lat: 21.4272, lng: 92.0058, max_guests: 8, bedrooms: 4, beds: 5, baths: 3, price_per_day: 12000, min_nights: 2, day: '18' },
  { tag: '102', hostTag: '12', title: 'Serviced Apartment in Gulshan', slug: 'serviced-apartment-gulshan', description: 'A bright, modern one-bedroom in the heart of Gulshan 2 — walking distance to cafés, embassies, and Banani.', place_type: 'entire', category: 'apartment', division: 'Dhaka', district: 'Dhaka', area: 'Gulshan', lat: 23.7925, lng: 90.4078, max_guests: 3, bedrooms: 1, beds: 2, baths: 1, price_per_day: 8500, min_nights: 1, day: '17' },
  { tag: '103', hostTag: '13', title: 'Tea Bungalow in Sreemangal', slug: 'tea-bungalow-sreemangal', description: 'Colonial-era bungalow surrounded by tea gardens. Misty mornings, a wraparound veranda, and a cook on request.', place_type: 'entire', category: 'villa', division: 'Sylhet', district: 'Moulvibazar', area: 'Sreemangal', lat: 24.3065, lng: 91.7296, max_guests: 6, bedrooms: 3, beds: 4, baths: 2, price_per_day: 9500, min_nights: 2, day: '16' },
  { tag: '104', hostTag: '13', title: 'Hill Resort Cabin in Bandarban', slug: 'hill-resort-cabin-bandarban', description: 'A private cabin on the Chimbuk range with clouds at your window. Bonfire pit, valley views, and a short drive to Nilgiri.', place_type: 'private', category: 'resort', division: 'Chattogram', district: 'Bandarban', area: 'Chimbuk', lat: 21.9700, lng: 92.3400, max_guests: 4, bedrooms: 2, beds: 2, baths: 1, price_per_day: 6500, min_nights: 1, day: '15' },
  { tag: '105', hostTag: '12', title: 'Heritage Room in Old Dhaka', slug: 'heritage-room-old-dhaka', description: 'A private room in a restored Old Dhaka home near Lalbagh Fort. Rickshaw art, courtyard, and the best biryani downstairs.', place_type: 'private', category: 'room', division: 'Dhaka', district: 'Dhaka', area: 'Lalbagh', lat: 23.7190, lng: 90.3870, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 3200, min_nights: 1, day: '14' },
  { tag: '106', hostTag: '13', title: 'Eco Studio near the Sundarbans', slug: 'eco-studio-sundarbans', description: 'An off-grid studio at the edge of the mangroves in Mongla. Solar-powered, birdsong everywhere, boat trips arranged.', place_type: 'entire', category: 'studio', division: 'Khulna', district: 'Bagerhat', area: 'Mongla', lat: 22.4920, lng: 89.5870, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 5400, min_nights: 2, day: '13' },
  { tag: '107', hostTag: '11', title: 'Coral Cottage on Saint Martin’s', slug: 'coral-cottage-saint-martins', description: 'A breezy cottage a minute from turquoise water on Saint Martin’s Island. Snorkelling gear included, fresh fish nightly.', place_type: 'entire', category: 'villa', division: 'Chattogram', district: 'Cox’s Bazar', area: 'Saint Martin’s', lat: 20.6270, lng: 92.3230, max_guests: 5, bedrooms: 2, beds: 3, baths: 2, price_per_day: 7800, min_nights: 2, day: '12' },
  { tag: '108', hostTag: '12', title: 'Riverside Apartment in Rajshahi', slug: 'riverside-apartment-rajshahi', description: 'A calm two-bedroom overlooking the Padma. Cycle the embankment at sunset; mango orchards in season.', place_type: 'entire', category: 'apartment', division: 'Rajshahi', district: 'Rajshahi', area: 'Padma', lat: 24.3640, lng: 88.6040, max_guests: 4, bedrooms: 2, beds: 2, baths: 1, price_per_day: 4600, min_nights: 1, day: '11' },
];

const LISTINGS: PublicListingRow[] = SEEDS.map((s) => ({
  id: uid(s.tag),
  host_id: uid(s.hostTag),
  title: s.title,
  slug: s.slug,
  description: s.description,
  place_type: s.place_type,
  category: s.category,
  status: 'published',
  division: s.division,
  district: s.district,
  area: s.area,
  lat: s.lat,
  lng: s.lng,
  max_guests: s.max_guests,
  bedrooms: s.bedrooms,
  beds: s.beds,
  baths: s.baths,
  price_per_day: s.price_per_day,
  min_nights: s.min_nights,
  rules: 'No smoking indoors. No parties or events. Check-in after 2 PM.',
  created_at: `2026-06-${s.day}T09:00:00.000Z`,
  updated_at: `2026-06-${s.day}T09:00:00.000Z`,
}));

/* ── Images (4 per listing) ────────────────────────────────────────────────── */
const IMAGES: ListingImage[] = SEEDS.flatMap((s) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: uid(`${s.tag}${i + 1}`),
    listing_id: uid(s.tag),
    url: img(s.slug, i + 1),
    sort_order: i,
    is_cover: i === 0,
    created_at: T,
  })),
);

/* ── Amenities ─────────────────────────────────────────────────────────────── */
const AMENITIES: Amenity[] = [
  { id: uid('201'), name: 'Wifi', icon_url: null, category: 'essentials' },
  { id: uid('202'), name: 'Air conditioning', icon_url: null, category: 'comfort' },
  { id: uid('203'), name: 'Kitchen', icon_url: null, category: 'essentials' },
  { id: uid('204'), name: 'Free parking', icon_url: null, category: 'facilities' },
  { id: uid('205'), name: 'Pool', icon_url: null, category: 'facilities' },
  { id: uid('206'), name: 'Hot water', icon_url: null, category: 'essentials' },
  { id: uid('207'), name: 'Workspace', icon_url: null, category: 'work' },
  { id: uid('208'), name: 'TV', icon_url: null, category: 'entertainment' },
  { id: uid('209'), name: 'Washer', icon_url: null, category: 'facilities' },
  { id: uid('210'), name: 'Beach access', icon_url: null, category: 'location' },
];

/** listing tag → amenity tags */
const LISTING_AMENITIES: Record<string, string[]> = {
  '101': ['201', '202', '203', '204', '205', '210'],
  '102': ['201', '202', '203', '206', '207', '208'],
  '103': ['201', '203', '204', '206', '207', '209'],
  '104': ['201', '206', '204', '210'],
  '105': ['201', '202', '206', '208'],
  '106': ['201', '203', '206', '210'],
  '107': ['201', '203', '206', '210'],
  '108': ['201', '202', '203', '207', '209'],
};

/* ── Collections (home page bands) ─────────────────────────────────────────── */
const COLLECTIONS: Collection[] = [
  { id: uid('301'), name: 'Editor’s picks', slug: 'editors-picks', description: 'Stays our team loves right now.', sort_order: 0, created_at: T },
  { id: uid('302'), name: 'Beachfront escapes', slug: 'beachfront-escapes', description: 'Wake up to the water.', sort_order: 1, created_at: T },
  { id: uid('303'), name: 'City stays', slug: 'city-stays', description: 'Central, modern, walk-everywhere.', sort_order: 2, created_at: T },
];

/** collection tag → ordered listing tags */
const COLLECTION_LISTINGS: Record<string, string[]> = {
  '301': ['101', '102', '103', '104', '105'],
  '302': ['101', '107', '106'],
  '303': ['102', '105', '108'],
};

/* ── Reviews (drive aggregate ratings) ─────────────────────────────────────── */
const REVIEW_RATINGS: Record<string, number[]> = {
  '101': [5, 5, 4, 5],
  '102': [5, 4, 5],
  '103': [5, 5, 5, 4],
  '104': [4, 5, 4],
  '105': [4, 4, 5],
  '106': [5, 4],
  '107': [5, 5, 4, 5],
  '108': [4, 5],
};

/* ── Demo bookings for the signed-in demo user ─────────────────────────────── */
const DEMO_BOOKINGS: Booking[] = [
  {
    id: uid('901'), listing_id: uid('102'), guest_id: DEMO_USER.id, host_id: uid('12'),
    check_in: '2026-07-12', check_out: '2026-07-15', guests: 2, nights: 3,
    base_amount: 25500, service_fee: 2550, total_amount: 28050, status: 'confirmed',
    special_request: 'Early check-in if possible.', payment_id: null,
    created_at: '2026-06-15T09:00:00.000Z', updated_at: '2026-06-15T09:00:00.000Z',
  },
  {
    id: uid('902'), listing_id: uid('101'), guest_id: DEMO_USER.id, host_id: uid('11'),
    check_in: '2026-08-01', check_out: '2026-08-04', guests: 4, nights: 3,
    base_amount: 36000, service_fee: 3600, total_amount: 39600, status: 'requested',
    special_request: null, payment_id: null,
    created_at: '2026-06-18T09:00:00.000Z', updated_at: '2026-06-18T09:00:00.000Z',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Pure query helpers (mirror the repository read semantics)
 * ────────────────────────────────────────────────────────────────────────── */
const byCreatedDesc = (a: PublicListingRow, b: PublicListingRow) =>
  b.created_at.localeCompare(a.created_at);

export function demoNewArrivals(limit: number): PublicListingRow[] {
  return [...LISTINGS].sort(byCreatedDesc).slice(0, limit);
}

export function demoListingBySlug(slug: string): PublicListingRow | null {
  return LISTINGS.find((l) => l.slug === slug) ?? null;
}

export function demoImagesFor(listingId: string): ListingImage[] {
  return IMAGES.filter((i) => i.listing_id === listingId).sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
}

export function demoCoverMap(listingIds: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of listingIds) {
    const cover = demoImagesFor(id)[0];
    if (cover) map[id] = cover.url;
  }
  return map;
}

export function demoAmenitiesFor(listingId: string): Amenity[] {
  const tag = listingTag(listingId);
  const ids = (tag && LISTING_AMENITIES[tag]) || [];
  return ids
    .map((t) => AMENITIES.find((a) => a.id === uid(t)))
    .filter((a): a is Amenity => Boolean(a));
}

export function demoHost(hostId: string): Profile | null {
  if (hostId === DEMO_USER.id) return DEMO_USER;
  return HOSTS.find((h) => h.id === hostId) ?? null;
}

export function demoRating(listingId: string): { average: number; count: number } {
  const tag = listingTag(listingId);
  const ratings = (tag && REVIEW_RATINGS[tag]) || [];
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((acc, n) => acc + n, 0);
  return { average: sum / ratings.length, count: ratings.length };
}

export function demoRatingMap(
  listingIds: string[],
): Record<string, { average: number; count: number }> {
  const out: Record<string, { average: number; count: number }> = {};
  for (const id of listingIds) out[id] = demoRating(id);
  return out;
}

export function demoSearch(filters: SearchFilters): SearchResultRows {
  let rows = LISTINGS.filter((l) => l.status === 'published');

  if (filters.division) rows = rows.filter((l) => l.division === filters.division);
  if (filters.district) rows = rows.filter((l) => l.district === filters.district);
  if (filters.area) rows = rows.filter((l) => l.area === filters.area);
  if (filters.location) {
    const t = filters.location.toLowerCase();
    rows = rows.filter((l) =>
      [l.area, l.district, l.division, l.title]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(t)),
    );
  }
  if (filters.guests) rows = rows.filter((l) => l.max_guests >= filters.guests!);
  if (filters.category) rows = rows.filter((l) => l.category === filters.category);
  if (filters.placeType) rows = rows.filter((l) => l.place_type === filters.placeType);
  if (filters.minPrice !== undefined)
    rows = rows.filter((l) => l.price_per_day >= filters.minPrice!);
  if (filters.maxPrice !== undefined)
    rows = rows.filter((l) => l.price_per_day <= filters.maxPrice!);

  switch (filters.sort) {
    case 'price_asc':
      rows = [...rows].sort((a, b) => a.price_per_day - b.price_per_day);
      break;
    case 'price_desc':
      rows = [...rows].sort((a, b) => b.price_per_day - a.price_per_day);
      break;
    default:
      rows = [...rows].sort(byCreatedDesc);
      break;
  }

  const total = rows.length;
  const from = (filters.page - 1) * filters.pageSize;
  return { rows: rows.slice(from, from + filters.pageSize), total };
}

export interface DemoCollectionBand {
  collection: Collection;
  rows: PublicListingRow[];
}

export function demoCollections(perCollection: number): DemoCollectionBand[] {
  return COLLECTIONS.map((collection) => {
    const tag = collection.id.slice(-3);
    const listingTags = COLLECTION_LISTINGS[tag] ?? [];
    const rows = listingTags
      .map((t) => LISTINGS.find((l) => l.id === uid(t)))
      .filter((l): l is PublicListingRow => Boolean(l))
      .slice(0, perCollection);
    return { collection, rows };
  }).filter((b) => b.rows.length > 0);
}

export function demoListingForBooking(listingId: string) {
  const l = LISTINGS.find((x) => x.id === listingId);
  if (!l) return null;
  return {
    id: l.id,
    host_id: l.host_id,
    status: l.status,
    price_per_day: l.price_per_day,
    min_nights: l.min_nights,
    max_guests: l.max_guests,
  };
}

export function demoBookingsForGuest(guestId: string): Booking[] {
  return DEMO_BOOKINGS.filter((b) => b.guest_id === guestId).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

export function demoBookingById(bookingId: string): Booking | null {
  return DEMO_BOOKINGS.find((b) => b.id === bookingId) ?? null;
}

export function demoListingSummary(listingId: string) {
  const l = LISTINGS.find((x) => x.id === listingId);
  if (!l) return null;
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    area: l.area,
    district: l.district,
    cover_url: demoImagesFor(listingId)[0]?.url ?? null,
  };
}

/** Recover the short fixture tag from a generated UUID (last 3 significant digits). */
function listingTag(listingId: string): string | null {
  const seed = SEEDS.find((s) => uid(s.tag) === listingId);
  return seed ? seed.tag : null;
}
