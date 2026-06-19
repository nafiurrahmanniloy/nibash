/**
 * demo/data.ts — in-memory fixture dataset + pure query helpers.
 *
 * This is the demo "database". When DEMO_MODE is on, the repository layer returns
 * data from here instead of querying Supabase — exactly the swappable-DB seam the
 * architecture exists for (ARCHITECTURE.md §1). Rows are in the SAME raw-row shapes
 * the real queries return, so services, pricing, DTO mapping, and the booking state
 * machine all run unchanged. No I/O here (no cookies, no Supabase) — pure data.
 *
 * Original content; images are generated placeholders (picsum.photos). Structure
 * mirrors the real Nibash surfaces: browse-by-type, browse-by-location, collection
 * bands, a popular-locations hub, and blog content.
 */
import type {
  Amenity,
  BlogPost,
  Booking,
  Collection,
  ListingImage,
  Profile,
} from '@nibash/shared';
import type { PublicListingRow } from '@/features/listings/listings.repository';
import type { SearchFilters, SearchResultRows } from '@/features/search/search.repository';

/** Build a syntactically-valid UUID from a short numeric tag (stable across runs). */
const uid = (tag: string) => `00000000-0000-4000-8000-${tag.padStart(12, '0')}`;
const img = (seed: string, i: number) =>
  `https://picsum.photos/seed/nibash-${seed}-${i}/1024/768`;
const avatar = (seed: string) => `https://picsum.photos/seed/nibash-host-${seed}/240/240`;

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
  { id: uid('11'), full_name: 'Ayesha Rahman', avatar_url: avatar('11'), phone: null, role: 'host', languages: ['English', 'Bangla'], identity_verified: true, bio: 'Superhost in Cox’s Bazar. I love helping guests find the sea.', created_at: T, updated_at: T },
  { id: uid('12'), full_name: 'Tanvir Hasan', avatar_url: avatar('12'), phone: null, role: 'host', languages: ['English', 'Bangla', 'Hindi'], identity_verified: true, bio: 'City apartments in Dhaka, kept spotless and central.', created_at: T, updated_at: T },
  { id: uid('13'), full_name: 'Niloy Chowdhury', avatar_url: avatar('13'), phone: null, role: 'host', languages: ['English', 'Bangla'], identity_verified: false, bio: 'Hill and tea-country hideaways in Sylhet and Bandarban.', created_at: T, updated_at: T },
  { id: uid('14'), full_name: 'Farzana Akter', avatar_url: avatar('14'), phone: null, role: 'host', languages: ['English', 'Bangla'], identity_verified: true, bio: 'Boutique hotels and serviced flats in Chattogram.', created_at: T, updated_at: T },
];

/* ── Listings (public row shape: no `address`) ─────────────────────────────── */
interface Seed {
  tag: string; hostTag: string; title: string; slug: string; description: string;
  place_type: PublicListingRow['place_type']; category: PublicListingRow['category'];
  division: string; district: string; area: string; lat: number; lng: number;
  max_guests: number; bedrooms: number; beds: number; baths: number;
  price_per_day: number; min_nights: number; day: string;
}

const SEEDS: Seed[] = [
  { tag: '101', hostTag: '11', title: 'Beachfront Villa in Cox’s Bazar', slug: 'beachfront-villa-coxs-bazar', description: 'Wake up to the Bay of Bengal from a private villa steps off Kolatoli beach. Sea-view terrace, full kitchen, and a quiet garden.', place_type: 'entire', category: 'villa', division: 'Chattogram', district: 'Cox’s Bazar', area: 'Kolatoli', lat: 21.4272, lng: 92.0058, max_guests: 8, bedrooms: 4, beds: 5, baths: 3, price_per_day: 12000, min_nights: 2, day: '18' },
  { tag: '102', hostTag: '12', title: 'Serviced Apartment in Gulshan', slug: 'serviced-apartment-gulshan', description: 'A bright, modern one-bedroom in the heart of Gulshan 2 — walking distance to cafés, embassies, and Banani.', place_type: 'entire', category: 'apartment', division: 'Dhaka', district: 'Dhaka', area: 'Gulshan', lat: 23.7925, lng: 90.4078, max_guests: 3, bedrooms: 1, beds: 2, baths: 1, price_per_day: 8500, min_nights: 1, day: '17' },
  { tag: '103', hostTag: '13', title: 'Tea Bungalow in Sreemangal', slug: 'tea-bungalow-sreemangal', description: 'Colonial-era bungalow surrounded by tea gardens. Misty mornings, a wraparound veranda, and a cook on request.', place_type: 'entire', category: 'villa', division: 'Sylhet', district: 'Moulvibazar', area: 'Sreemangal', lat: 24.3065, lng: 91.7296, max_guests: 6, bedrooms: 3, beds: 4, baths: 2, price_per_day: 9500, min_nights: 2, day: '16' },
  { tag: '104', hostTag: '13', title: 'Hill Resort Cabin in Bandarban', slug: 'hill-resort-cabin-bandarban', description: 'A private cabin on the Chimbuk range with clouds at your window. Bonfire pit, valley views, and a short drive to Nilgiri.', place_type: 'private', category: 'resort', division: 'Chattogram', district: 'Bandarban', area: 'Chimbuk', lat: 21.97, lng: 92.34, max_guests: 4, bedrooms: 2, beds: 2, baths: 1, price_per_day: 6500, min_nights: 1, day: '15' },
  { tag: '105', hostTag: '12', title: 'Heritage Room in Old Dhaka', slug: 'heritage-room-old-dhaka', description: 'A private room in a restored Old Dhaka home near Lalbagh Fort. Rickshaw art, courtyard, and the best biryani downstairs.', place_type: 'private', category: 'room', division: 'Dhaka', district: 'Dhaka', area: 'Lalbagh', lat: 23.719, lng: 90.387, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 3200, min_nights: 1, day: '14' },
  { tag: '106', hostTag: '13', title: 'Eco Studio near the Sundarbans', slug: 'eco-studio-sundarbans', description: 'An off-grid studio at the edge of the mangroves in Mongla. Solar-powered, birdsong everywhere, boat trips arranged.', place_type: 'entire', category: 'studio', division: 'Khulna', district: 'Bagerhat', area: 'Mongla', lat: 22.492, lng: 89.587, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 5400, min_nights: 2, day: '13' },
  { tag: '107', hostTag: '11', title: 'Coral Cottage on Saint Martin’s', slug: 'coral-cottage-saint-martins', description: 'A breezy cottage a minute from turquoise water on Saint Martin’s Island. Snorkelling gear included, fresh fish nightly.', place_type: 'entire', category: 'villa', division: 'Chattogram', district: 'Cox’s Bazar', area: 'Saint Martin’s', lat: 20.627, lng: 92.323, max_guests: 5, bedrooms: 2, beds: 3, baths: 2, price_per_day: 7800, min_nights: 2, day: '12' },
  { tag: '108', hostTag: '12', title: 'Riverside Apartment in Rajshahi', slug: 'riverside-apartment-rajshahi', description: 'A calm two-bedroom overlooking the Padma. Cycle the embankment at sunset; mango orchards in season.', place_type: 'entire', category: 'apartment', division: 'Rajshahi', district: 'Rajshahi', area: 'Padma', lat: 24.364, lng: 88.604, max_guests: 4, bedrooms: 2, beds: 2, baths: 1, price_per_day: 4600, min_nights: 1, day: '11' },
  { tag: '109', hostTag: '12', title: 'Designer Flat in Dhanmondi', slug: 'designer-flat-dhanmondi', description: 'A two-bedroom designer flat off Dhanmondi 27, steps from the lake, Rabindra Sarobar, and the best cafés in town.', place_type: 'entire', category: 'apartment', division: 'Dhaka', district: 'Dhaka', area: 'Dhanmondi', lat: 23.7461, lng: 90.376, max_guests: 4, bedrooms: 2, beds: 3, baths: 2, price_per_day: 9800, min_nights: 1, day: '19' },
  { tag: '110', hostTag: '14', title: 'Boutique Hotel Suite in Agrabad', slug: 'boutique-hotel-suite-agrabad', description: 'A serviced suite in Chattogram’s business district — breakfast included, fast wifi, and a rooftop with port views.', place_type: 'private', category: 'hotel', division: 'Chattogram', district: 'Chattogram', area: 'Agrabad', lat: 22.3261, lng: 91.8083, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 7200, min_nights: 1, day: '20' },
  { tag: '111', hostTag: '12', title: 'Quiet Room in Banani', slug: 'quiet-room-banani', description: 'A private ensuite room in a calm Banani residence. Workspace, blackout curtains, and a 5-minute walk to Kemal Ataturk Ave.', place_type: 'private', category: 'room', division: 'Dhaka', district: 'Dhaka', area: 'Banani', lat: 23.7937, lng: 90.4066, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 4200, min_nights: 1, day: '10' },
  { tag: '112', hostTag: '12', title: 'Compact Studio in Uttara', slug: 'compact-studio-uttara', description: 'A smart studio in Uttara Sector 7, minutes from the metro and the airport — ideal for a quick business stay.', place_type: 'entire', category: 'studio', division: 'Dhaka', district: 'Dhaka', area: 'Uttara', lat: 23.8759, lng: 90.3795, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, price_per_day: 3900, min_nights: 1, day: '09' },
  { tag: '113', hostTag: '12', title: 'Family Apartment in Bashundhara', slug: 'family-apartment-bashundhara', description: 'A spacious three-bedroom in Bashundhara Block C, near Jamuna Future Park. Great for families and longer stays.', place_type: 'entire', category: 'apartment', division: 'Dhaka', district: 'Dhaka', area: 'Bashundhara', lat: 23.8201, lng: 90.4256, max_guests: 6, bedrooms: 3, beds: 4, baths: 2, price_per_day: 11000, min_nights: 2, day: '08' },
  { tag: '114', hostTag: '13', title: 'City Hotel Room in Zindabazar', slug: 'city-hotel-room-zindabazar', description: 'A tidy double in the centre of Sylhet city — walk to Zindabazar’s restaurants and a short ride to Hazrat Shah Jalal.', place_type: 'private', category: 'hotel', division: 'Sylhet', district: 'Sylhet', area: 'Zindabazar', lat: 24.8949, lng: 91.8687, max_guests: 2, bedrooms: 1, beds: 2, baths: 1, price_per_day: 5200, min_nights: 1, day: '07' },
  { tag: '115', hostTag: '11', title: 'Inani Beach Resort Villa', slug: 'inani-beach-resort-villa', description: 'A four-bedroom resort villa on quiet Inani beach, with a private plunge pool and a chef for big groups and parties.', place_type: 'entire', category: 'resort', division: 'Chattogram', district: 'Cox’s Bazar', area: 'Inani', lat: 21.2333, lng: 92.0445, max_guests: 10, bedrooms: 4, beds: 6, baths: 4, price_per_day: 18000, min_nights: 2, day: '21' },
  { tag: '116', hostTag: '12', title: 'Bright Apartment in Mirpur DOHS', slug: 'bright-apartment-mirpur-dohs', description: 'A peaceful two-bedroom in Mirpur DOHS with lift, generator, and parking — a comfortable base on a budget.', place_type: 'entire', category: 'apartment', division: 'Dhaka', district: 'Dhaka', area: 'Mirpur', lat: 23.8223, lng: 90.3654, max_guests: 4, bedrooms: 2, beds: 2, baths: 2, price_per_day: 5600, min_nights: 1, day: '06' },
];

const LISTINGS: PublicListingRow[] = SEEDS.map((s) => ({
  id: uid(s.tag), host_id: uid(s.hostTag), title: s.title, slug: s.slug,
  description: s.description, place_type: s.place_type, category: s.category,
  status: 'published', division: s.division, district: s.district, area: s.area,
  lat: s.lat, lng: s.lng, max_guests: s.max_guests, bedrooms: s.bedrooms,
  beds: s.beds, baths: s.baths, price_per_day: s.price_per_day, min_nights: s.min_nights,
  rules: 'No smoking indoors. No parties or events unless the listing allows it. Check-in after 2 PM.',
  created_at: `2026-06-${s.day}T09:00:00.000Z`, updated_at: `2026-06-${s.day}T09:00:00.000Z`,
}));

/* ── Images (4 per listing) ────────────────────────────────────────────────── */
const IMAGES: ListingImage[] = SEEDS.flatMap((s) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: uid(`${s.tag}${i + 1}`), listing_id: uid(s.tag), url: img(s.slug, i + 1),
    sort_order: i, is_cover: i === 0, created_at: T,
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
  { id: uid('211'), name: 'Generator backup', icon_url: null, category: 'essentials' },
  { id: uid('212'), name: 'Breakfast included', icon_url: null, category: 'comfort' },
];

const LISTING_AMENITIES: Record<string, string[]> = {
  '101': ['201', '202', '203', '204', '205', '210'],
  '102': ['201', '202', '203', '206', '207', '208'],
  '103': ['201', '203', '204', '206', '207', '209'],
  '104': ['201', '206', '204', '210'],
  '105': ['201', '202', '206', '208'],
  '106': ['201', '203', '206', '210'],
  '107': ['201', '203', '206', '210'],
  '108': ['201', '202', '203', '207', '209'],
  '109': ['201', '202', '203', '207', '208', '211'],
  '110': ['201', '202', '206', '208', '212'],
  '111': ['201', '202', '206', '207', '211'],
  '112': ['201', '202', '203', '207'],
  '113': ['201', '202', '203', '204', '209', '211'],
  '114': ['201', '202', '206', '208', '212'],
  '115': ['201', '202', '203', '204', '205', '210'],
  '116': ['201', '202', '203', '204', '211'],
};

/* ── Collections (home page bands — mirrors the real Nibash bands) ──────────── */
const COLLECTIONS: Collection[] = [
  { id: uid('301'), name: 'Bangladesh Getaways', slug: 'bangladesh-getaways', description: 'Scenic escapes across the country.', sort_order: 0, created_at: T },
  { id: uid('302'), name: 'Signature Apartments', slug: 'signature-apartments', description: 'Our most-loved city flats.', sort_order: 1, created_at: T },
  { id: uid('303'), name: 'Dhaka Homes', slug: 'dhaka-homes', description: 'Stay in the heart of the capital.', sort_order: 2, created_at: T },
  { id: uid('304'), name: 'Chittagong Comfort Homes', slug: 'chittagong-comfort-homes', description: 'Port city and coast.', sort_order: 3, created_at: T },
  { id: uid('305'), name: 'Sylheti Grand Stays', slug: 'sylheti-grand-stays', description: 'Tea country and city.', sort_order: 4, created_at: T },
  { id: uid('306'), name: 'Studio Apartments', slug: 'studio-apartments', description: 'Smart, compact, and central.', sort_order: 5, created_at: T },
  { id: uid('307'), name: 'Small Gatherings', slug: 'small-gatherings', description: 'Room for the whole group.', sort_order: 6, created_at: T },
  { id: uid('308'), name: 'Party Stays 🎉', slug: 'party-stays', description: 'Big villas built for celebrations.', sort_order: 7, created_at: T },
];

const COLLECTION_LISTINGS: Record<string, string[]> = {
  '301': ['101', '104', '107', '115', '103', '106'],
  '302': ['102', '109', '113', '108', '116'],
  '303': ['102', '109', '111', '113', '116', '112'],
  '304': ['110', '101', '107', '115'],
  '305': ['103', '114'],
  '306': ['106', '112'],
  '307': ['103', '104', '116', '108', '113'],
  '308': ['101', '107', '115'],
};

/* ── Reviews (drive aggregate ratings) ─────────────────────────────────────── */
const REVIEW_RATINGS: Record<string, number[]> = {
  '101': [5, 5, 4, 5], '102': [5, 4, 5], '103': [5, 5, 5, 4], '104': [4, 5, 4],
  '105': [4, 4, 5], '106': [5, 4], '107': [5, 5, 4, 5], '108': [4, 5],
  '109': [5, 5, 4], '110': [4, 5, 4, 4], '111': [4, 5], '112': [4, 4, 5],
  '113': [5, 4, 5, 5], '114': [4, 4], '115': [5, 5, 5, 4], '116': [4, 5, 4],
};

/* ── Popular locations (the /popular-locations hub) ────────────────────────── */
export interface DemoLocation {
  name: string;
  /** Free-text location filter passed to search. */
  query: string;
  count: number;
  rating: number;
  tag: string;
}
const LOCATIONS: DemoLocation[] = [
  { name: 'Gulshan', query: 'Gulshan', count: 1150, rating: 4.8, tag: 'City Center' },
  { name: 'Dhanmondi', query: 'Dhanmondi', count: 890, rating: 4.7, tag: 'City Center' },
  { name: 'Banani', query: 'Banani', count: 670, rating: 4.7, tag: 'City Center' },
  { name: 'Uttara', query: 'Uttara', count: 780, rating: 4.6, tag: 'Near Airport' },
  { name: 'Bashundhara', query: 'Bashundhara', count: 820, rating: 4.6, tag: 'Residential' },
  { name: 'Mirpur', query: 'Mirpur', count: 950, rating: 4.5, tag: 'Residential' },
  { name: 'Cox’s Bazar', query: 'Cox', count: 1850, rating: 4.9, tag: 'Beach Resort' },
  { name: 'Saint Martin’s', query: 'Saint Martin', count: 210, rating: 4.9, tag: 'Island' },
  { name: 'Chattogram', query: 'Chattogram', count: 1850, rating: 4.6, tag: 'Port City' },
  { name: 'Bandarban', query: 'Bandarban', count: 520, rating: 4.8, tag: 'Hill Tracts' },
  { name: 'Sylhet', query: 'Sylhet', count: 1350, rating: 4.8, tag: 'Tea Country' },
  { name: 'Sreemangal', query: 'Sreemangal', count: 430, rating: 4.9, tag: 'Tea Country' },
  { name: 'Rajshahi', query: 'Rajshahi', count: 720, rating: 4.5, tag: 'Riverside' },
  { name: 'Khulna', query: 'Khulna', count: 800, rating: 4.4, tag: 'Sundarbans' },
];

/* ── Blog posts (the /blogs surface) ───────────────────────────────────────── */
function post(
  tag: string, title: string, slug: string, category: string, author: string,
  readMinutes: number, day: string, excerpt: string, body: string,
): BlogPost {
  return {
    id: uid(tag), title, slug, excerpt, body,
    cover_url: `https://picsum.photos/seed/nibash-blog-${slug}/1200/630`,
    category, author, read_minutes: readMinutes, status: 'published',
    published_at: `2026-05-${day}T09:00:00.000Z`,
    created_at: `2026-05-${day}T09:00:00.000Z`, updated_at: `2026-05-${day}T09:00:00.000Z`,
  };
}
const BLOG_POSTS: BlogPost[] = [
  post('401', 'Where to stay in Cox’s Bazar: a first-timer’s guide', 'coxs-bazar-stay-guide', 'Guides', 'Ayesha Rahman', 6, '28',
    'From Kolatoli’s buzz to quiet Inani, here’s how to choose the right stretch of the world’s longest beach.',
    'Cox’s Bazar runs for over 120 km, and where you stay changes the trip entirely. Kolatoli and Sugandha are the lively heart — restaurants, night markets, and easy beach access. If you want calm, head south to Inani and Himchari, where the crowds thin and the water turns clear.\n\nFor families and groups, a private villa near the beach beats a hotel room: a kitchen, a garden, and space to spread out. Book two nights minimum on weekends, and travel midweek for the best prices. Whatever you pick on Nibash, you’ll be a short walk from the sea.'),
  post('402', 'A slow weekend in Sreemangal’s tea country', 'sreemangal-weekend', 'Guides', 'Niloy Chowdhury', 5, '24',
    'Misty mornings, seven-layer tea, and a colonial bungalow among the gardens — the perfect two-day reset.',
    'Sreemangal is Bangladesh’s tea capital, and a weekend here is all about slowing down. Start with a dawn walk through the gardens before the heat, then try the famous seven-layer tea in town.\n\nStay in a heritage bungalow among the estates — verandas, a cook on request, and birdsong instead of traffic. Lawachara National Park is a short ride away for a guided forest walk. Two nights is just right.'),
  post('403', 'Old Dhaka food crawl: a one-day itinerary', 'old-dhaka-food-crawl', 'Food', 'Tanvir Hasan', 7, '20',
    'Biryani, bakarkhani, and the best kebabs in the capital — a walking route through the old city.',
    'Old Dhaka is the city’s kitchen. Start late morning in Lalbagh, then wind through Nazira Bazar and Chawkbazar, eating as you go: kacchi biryani, bakarkhani fresh from the oven, and smoky kebabs at dusk.\n\nStay a night in a heritage room nearby so you can do it properly — and walk it off the next morning at Lalbagh Fort and Ahsan Manzil.'),
  post('404', 'Dhaka on business: the best serviced apartments', 'dhaka-business-apartments', 'City', 'Farzana Akter', 4, '18',
    'Fast wifi, a real desk, and a quiet night — where to base yourself for a productive trip to the capital.',
    'For work trips, a serviced apartment beats a hotel: a kitchen, laundry, and room to think. Gulshan and Banani put you near most offices and the best cafés; Uttara is closest to the airport and the new metro.\n\nLook for a dedicated workspace, generator backup, and parking. A one-bedroom is plenty for a solo traveller; book a two-bedroom if a colleague is joining.'),
  post('405', 'Saint Martin’s Island on a budget', 'saint-martins-budget', 'Guides', 'Ayesha Rahman', 5, '16',
    'Coral, clear water, and fresh fish — how to do Bangladesh’s only coral island without overspending.',
    'Saint Martin’s is small, and that’s the charm. Travel in the cooler months, take the morning boat from Teknaf, and stay at least one night to see the island empty out after the day-trippers leave.\n\nA simple cottage near the water, fresh fish dinners, and a sunrise walk to the north point are all you need. Pack light and carry cash — and snorkel the reefs off the west side.'),
  post('406', 'Bandarban hill tracts: when to go and where to sleep', 'bandarban-guide', 'Guides', 'Niloy Chowdhury', 6, '12',
    'Clouds at your window on the Chimbuk range — planning a trip to the most scenic corner of the country.',
    'Bandarban is at its best from late autumn to early spring, when the air is clear and the hills are green. Base yourself on the Chimbuk range for the views, with day trips to Nilgiri and the Golden Temple.\n\nA private cabin with a bonfire pit is the move — bring warm layers for the evenings. Hire a local guide for the trickier viewpoints, and start early to beat the afternoon haze.'),
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
  if (filters.minPrice !== undefined) rows = rows.filter((l) => l.price_per_day >= filters.minPrice!);
  if (filters.maxPrice !== undefined) rows = rows.filter((l) => l.price_per_day <= filters.maxPrice!);

  switch (filters.sort) {
    case 'price_asc': rows = [...rows].sort((a, b) => a.price_per_day - b.price_per_day); break;
    case 'price_desc': rows = [...rows].sort((a, b) => b.price_per_day - a.price_per_day); break;
    default: rows = [...rows].sort(byCreatedDesc); break;
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
  return { id: l.id, host_id: l.host_id, status: l.status, price_per_day: l.price_per_day, min_nights: l.min_nights, max_guests: l.max_guests };
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
  return { id: l.id, slug: l.slug, title: l.title, area: l.area, district: l.district, cover_url: demoImagesFor(listingId)[0]?.url ?? null };
}

/** Popular locations for the hub + footer. */
export function demoLocations(): DemoLocation[] {
  return LOCATIONS;
}
/** Published blog posts, newest first. */
export function demoBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) =>
    (b.published_at ?? '').localeCompare(a.published_at ?? ''),
  );
}
export function demoBlogBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}

/* ── Demo bookings for the signed-in demo user ─────────────────────────────── */
const DEMO_BOOKINGS: Booking[] = [
  { id: uid('901'), listing_id: uid('102'), guest_id: DEMO_USER.id, host_id: uid('12'), check_in: '2026-07-12', check_out: '2026-07-15', guests: 2, nights: 3, base_amount: 25500, service_fee: 2550, total_amount: 28050, status: 'confirmed', special_request: 'Early check-in if possible.', payment_id: null, created_at: '2026-06-15T09:00:00.000Z', updated_at: '2026-06-15T09:00:00.000Z' },
  { id: uid('902'), listing_id: uid('101'), guest_id: DEMO_USER.id, host_id: uid('11'), check_in: '2026-08-01', check_out: '2026-08-04', guests: 4, nights: 3, base_amount: 36000, service_fee: 3600, total_amount: 39600, status: 'requested', special_request: null, payment_id: null, created_at: '2026-06-18T09:00:00.000Z', updated_at: '2026-06-18T09:00:00.000Z' },
];

/** Recover the short fixture tag from a generated UUID. */
function listingTag(listingId: string): string | null {
  const seed = SEEDS.find((s) => uid(s.tag) === listingId);
  return seed ? seed.tag : null;
}
