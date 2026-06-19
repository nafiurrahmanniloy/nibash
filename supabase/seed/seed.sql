-- ============================================================================
-- seed/seed.sql — Demo content so the marketplace renders (BUILD-PLAN Phase 1)
-- ----------------------------------------------------------------------------
-- Loads: amenities, collections, demo host profiles + auth users, demo
-- listings, listing_images, listing_amenities, listing_collections.
-- Prices are realistic BDT; locations use real Bangladesh divisions/districts/
-- areas. All copy is original.
--
-- Idempotent: stable UUIDs + ON CONFLICT DO NOTHING / DO UPDATE so re-running
-- `supabase db reset` (or re-seeding) is safe.
--
-- NOTE: seeding runs with the service role, which bypasses RLS — expected for
-- a fixture loader. Demo auth users get a placeholder encrypted password.
-- ============================================================================

-- ── Amenities ────────────────────────────────────────────────────────────────
insert into public.amenities (id, name, slug, category) values
  ('a0000000-0000-0000-0000-000000000001', 'Wi-Fi',            'wifi',           'essentials'),
  ('a0000000-0000-0000-0000-000000000002', 'Air conditioning', 'ac',             'essentials'),
  ('a0000000-0000-0000-0000-000000000003', 'Kitchen',          'kitchen',        'essentials'),
  ('a0000000-0000-0000-0000-000000000004', 'Free parking',     'parking',        'facilities'),
  ('a0000000-0000-0000-0000-000000000005', 'Swimming pool',    'pool',           'facilities'),
  ('a0000000-0000-0000-0000-000000000006', 'Washing machine',  'washer',         'essentials'),
  ('a0000000-0000-0000-0000-000000000007', 'Backup generator', 'generator',      'essentials'),
  ('a0000000-0000-0000-0000-000000000008', 'Hot water',        'hot-water',      'essentials'),
  ('a0000000-0000-0000-0000-000000000009', 'Workspace',        'workspace',      'work'),
  ('a0000000-0000-0000-0000-00000000000a', 'TV',               'tv',             'entertainment'),
  ('a0000000-0000-0000-0000-00000000000b', 'Elevator',         'elevator',       'facilities'),
  ('a0000000-0000-0000-0000-00000000000c', 'Rooftop terrace',  'rooftop',        'facilities'),
  ('a0000000-0000-0000-0000-00000000000d', 'Sea view',         'sea-view',       'views'),
  ('a0000000-0000-0000-0000-00000000000e', 'Breakfast',        'breakfast',      'meals'),
  ('a0000000-0000-0000-0000-00000000000f', '24/7 security',    'security',       'safety'),
  ('a0000000-0000-0000-0000-000000000010', 'Gym',              'gym',            'facilities')
on conflict (id) do nothing;

-- ── Collections (curated homepage bands) ─────────────────────────────────────
insert into public.collections (id, name, slug, description, sort_order) values
  ('c0000000-0000-0000-0000-000000000001', 'New Arrivals',
     'Freshly listed stays just added to Nibash.', 1),
  ('c0000000-0000-0000-0000-000000000002', 'Party Stays',
     'Spacious homes built for gatherings and group getaways.', 2),
  ('c0000000-0000-0000-0000-000000000003', 'Dhaka City Picks',
     'Comfortable urban stays across the capital.', 3),
  ('c0000000-0000-0000-0000-000000000004', 'Cox''s Bazar Escapes',
     'Beachfront and sea-view retreats by the world''s longest beach.', 4),
  ('c0000000-0000-0000-0000-000000000005', 'Sylhet Getaways',
     'Tea-country calm and hillside views in the northeast.', 5)
on conflict (id) do nothing;

-- ── Demo auth users (hosts) ──────────────────────────────────────────────────
-- Minimal rows so the FK from listings.host_id resolves. The handle_new_user
-- trigger (0002) creates the matching profiles row; we upsert profile details
-- afterwards. Placeholder password hash — these are fixtures, not real logins.
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
   created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'host.ayesha@nibash.demo', crypt('demo-password', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ayesha Rahman"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'host.tanvir@nibash.demo', crypt('demo-password', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Tanvir Hasan"}', now(), now())
on conflict (id) do nothing;

-- ── Host profiles (upsert details; row may already exist via trigger) ────────
insert into public.profiles
  (id, full_name, role, bio, identity_verified, languages)
values
  ('11111111-1111-1111-1111-111111111111', 'Ayesha Rahman', 'host',
   'Superhost in Dhaka who loves matching travellers with calm, well-kept homes.',
   true, array['en','bn']),
  ('22222222-2222-2222-2222-222222222222', 'Tanvir Hasan', 'host',
   'Hosts beachside and hillside stays; quick to reply and big on local tips.',
   true, array['en','bn'])
on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      bio = excluded.bio,
      identity_verified = excluded.identity_verified,
      languages = excluded.languages;

-- ── Listings ─────────────────────────────────────────────────────────────────
insert into public.listings
  (id, host_id, title, slug, description, place_type, category, status,
   division, district, area, address, lat, lng,
   max_guests, bedrooms, beds, baths, price_per_day, min_nights, rules)
values
  ('d0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'Bright 2-Bedroom Apartment in Gulshan', 'bright-2br-gulshan',
   'A sunlit two-bedroom flat moments from Gulshan 2 circle. Fast Wi-Fi, a full kitchen, and a quiet street make it ideal for work trips or weekend stays.',
   'entire', 'apartment', 'published',
   'Dhaka', 'Dhaka', 'Gulshan', 'Road 11, Gulshan 2, Dhaka', 23.7925, 90.4078,
   4, 2, 3, 2.0, 6500.00, 1,
   'No smoking indoors. No parties. Quiet hours after 11 PM.'),

  ('d0000000-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   'Cosy Studio near Dhanmondi Lake', 'cosy-studio-dhanmondi',
   'A compact, thoughtfully furnished studio a short walk from Dhanmondi Lake. Perfect for solo travellers and couples who want a central, walkable base.',
   'entire', 'studio', 'published',
   'Dhaka', 'Dhaka', 'Dhanmondi', 'Road 8A, Dhanmondi, Dhaka', 23.7461, 90.3742,
   2, 1, 1, 1.0, 3800.00, 1,
   'No smoking. Guests only. Please remove shoes indoors.'),

  ('d0000000-0000-0000-0000-000000000003',
   '22222222-2222-2222-2222-222222222222',
   'Sea-View Villa with Pool in Cox''s Bazar', 'sea-view-villa-coxs-bazar',
   'Wake up to the Bay of Bengal from this four-bedroom villa with a private pool and rooftop terrace. Built for groups who want space, sea breeze, and sunsets.',
   'entire', 'villa', 'published',
   'Chattogram', 'Cox''s Bazar', 'Kolatoli', 'Kolatoli Beach Road, Cox''s Bazar',
   21.4272, 92.0058,
   10, 4, 6, 4.0, 22000.00, 2,
   'Pool access supervised for children. No loud music after midnight.'),

  ('d0000000-0000-0000-0000-000000000004',
   '22222222-2222-2222-2222-222222222222',
   'Hillside Cottage in Sylhet Tea Country', 'hillside-cottage-sylhet',
   'A peaceful private cottage surrounded by tea gardens on the edge of Sylhet town. Misty mornings, birdsong, and a porch made for slow coffee.',
   'private', 'room', 'published',
   'Sylhet', 'Sylhet', 'Khadimnagar', 'Khadimnagar, Sylhet', 24.9410, 91.9320,
   3, 1, 2, 1.0, 5200.00, 1,
   'Respect the garden. No smoking inside the cottage.'),

  ('d0000000-0000-0000-0000-000000000005',
   '11111111-1111-1111-1111-111111111111',
   'Spacious 3-Bedroom Home for Groups in Banani', 'spacious-3br-banani',
   'A roomy three-bedroom home with a large living area and rooftop access in the heart of Banani. Comfortably hosts a family or a small group of friends.',
   'entire', 'apartment', 'published',
   'Dhaka', 'Dhaka', 'Banani', 'Road 27, Banani, Dhaka', 23.7936, 90.4043,
   8, 3, 5, 3.0, 11000.00, 1,
   'Small gatherings allowed until 11 PM. No smoking indoors.'),

  ('d0000000-0000-0000-0000-000000000006',
   '22222222-2222-2222-2222-222222222222',
   'Boutique Hotel Room in Chattogram GEC', 'boutique-room-chattogram-gec',
   'A clean, modern hotel-style room in the GEC business district of Chattogram, with breakfast and 24/7 security. Great for short business stays.',
   'private', 'hotel', 'published',
   'Chattogram', 'Chattogram', 'GEC Circle', 'GEC Circle, Chattogram',
   22.3596, 91.8214,
   2, 1, 1, 1.0, 4200.00, 1,
   'Check-in from 2 PM. Valid ID required at arrival.')
on conflict (id) do nothing;

-- ── Listing images (cover + gallery) ─────────────────────────────────────────
-- Original placeholder URLs; replace with client photos in Phase 3.
insert into public.listing_images (id, listing_id, url, sort_order, is_cover) values
  ('e0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000001', 'https://images.nibash.demo/listings/gulshan-1.jpg', 0, true),
  ('e0000000-0000-0000-0000-000000000102', 'd0000000-0000-0000-0000-000000000001', 'https://images.nibash.demo/listings/gulshan-2.jpg', 1, false),
  ('e0000000-0000-0000-0000-000000000103', 'd0000000-0000-0000-0000-000000000001', 'https://images.nibash.demo/listings/gulshan-3.jpg', 2, false),

  ('e0000000-0000-0000-0000-000000000201', 'd0000000-0000-0000-0000-000000000002', 'https://images.nibash.demo/listings/dhanmondi-1.jpg', 0, true),
  ('e0000000-0000-0000-0000-000000000202', 'd0000000-0000-0000-0000-000000000002', 'https://images.nibash.demo/listings/dhanmondi-2.jpg', 1, false),

  ('e0000000-0000-0000-0000-000000000301', 'd0000000-0000-0000-0000-000000000003', 'https://images.nibash.demo/listings/coxs-villa-1.jpg', 0, true),
  ('e0000000-0000-0000-0000-000000000302', 'd0000000-0000-0000-0000-000000000003', 'https://images.nibash.demo/listings/coxs-villa-2.jpg', 1, false),
  ('e0000000-0000-0000-0000-000000000303', 'd0000000-0000-0000-0000-000000000003', 'https://images.nibash.demo/listings/coxs-villa-3.jpg', 2, false),

  ('e0000000-0000-0000-0000-000000000401', 'd0000000-0000-0000-0000-000000000004', 'https://images.nibash.demo/listings/sylhet-1.jpg', 0, true),
  ('e0000000-0000-0000-0000-000000000402', 'd0000000-0000-0000-0000-000000000004', 'https://images.nibash.demo/listings/sylhet-2.jpg', 1, false),

  ('e0000000-0000-0000-0000-000000000501', 'd0000000-0000-0000-0000-000000000005', 'https://images.nibash.demo/listings/banani-1.jpg', 0, true),
  ('e0000000-0000-0000-0000-000000000502', 'd0000000-0000-0000-0000-000000000005', 'https://images.nibash.demo/listings/banani-2.jpg', 1, false),

  ('e0000000-0000-0000-0000-000000000601', 'd0000000-0000-0000-0000-000000000006', 'https://images.nibash.demo/listings/ctg-gec-1.jpg', 0, true),
  ('e0000000-0000-0000-0000-000000000602', 'd0000000-0000-0000-0000-000000000006', 'https://images.nibash.demo/listings/ctg-gec-2.jpg', 1, false)
on conflict (id) do nothing;

-- ── Listing ↔ amenities ──────────────────────────────────────────────────────
insert into public.listing_amenities (listing_id, amenity_id) values
  -- Gulshan apartment
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000009'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000b'),
  -- Dhanmondi studio
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000008'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000a'),
  -- Cox's Bazar villa
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000c'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000d'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000f'),
  -- Sylhet cottage
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000008'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-00000000000e'),
  -- Banani home
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-00000000000c'),
  -- Chattogram GEC room
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-00000000000e'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-00000000000f')
on conflict (listing_id, amenity_id) do nothing;

-- ── Listing ↔ collections ────────────────────────────────────────────────────
insert into public.listing_collections (collection_id, listing_id, sort_order) values
  -- New Arrivals (a spread of fresh listings)
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 0),
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 1),
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 2),
  -- Party Stays (large-capacity homes)
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 0),
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 1),
  -- Dhaka City Picks
  ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 0),
  ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 1),
  ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', 2),
  -- Cox's Bazar Escapes
  ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 0),
  -- Sylhet Getaways
  ('c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 0)
on conflict (collection_id, listing_id) do nothing;

-- ── A couple of blog posts so the blog surface renders ───────────────────────
insert into public.blog_posts
  (id, title, slug, excerpt, body, category, author, read_minutes, status, published_at)
values
  ('f0000000-0000-0000-0000-000000000001',
   'A Weekend Guide to Cox''s Bazar', 'weekend-guide-coxs-bazar',
   'Where to stay, what to eat, and how to catch the best sunset on the longest beach.',
   'From Kolatoli to Inani, here is how to spend two unhurried days by the Bay of Bengal...',
   'Travel Tips', 'Nibash Editorial', 6, 'published', now()),
  ('f0000000-0000-0000-0000-000000000002',
   'Hosting 101: Setting Up Your First Stay', 'hosting-101-first-stay',
   'Simple steps to turn a spare room or flat into a welcoming, bookable space.',
   'Great hosting starts before the first guest arrives. Here is a practical checklist...',
   'Hosting', 'Nibash Editorial', 5, 'published', now())
on conflict (id) do nothing;
