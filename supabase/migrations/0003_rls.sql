-- ============================================================================
-- 0003_rls.sql — Row Level Security (BUILD-PLAN §3 RLS)
-- ----------------------------------------------------------------------------
-- Enables RLS on every public table and defines concrete policies:
--   * published listings (+ their images/amenities/collections) are public-read
--   * guests read/write their own bookings/messages/notifications
--   * hosts read bookings/messages for their listings and manage their listings
--   * admins (profiles.role='admin') get full access everywhere
--   * profiles: self read/update + public-read of limited host fields (a view)
-- Helper functions are SECURITY DEFINER to avoid RLS recursion when checking
-- the caller's role/ownership.
-- ============================================================================

-- ── Helper: is the current user an admin? ───────────────────────────────────
-- SECURITY DEFINER so reading profiles here does not re-trigger profiles RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'True when the JWT subject has profiles.role = admin. Used by RLS policies.';

-- ── Helper: does the current user host this listing? ─────────────────────────
create or replace function public.owns_listing(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.listings
    where id = p_listing_id and host_id = auth.uid()
  );
$$;

comment on function public.owns_listing(uuid) is
  'True when the current user is the host of the given listing.';

-- ── Enable RLS on every table ───────────────────────────────────────────────
alter table public.profiles              enable row level security;
alter table public.listings              enable row level security;
alter table public.listing_images        enable row level security;
alter table public.amenities             enable row level security;
alter table public.listing_amenities     enable row level security;
alter table public.collections           enable row level security;
alter table public.listing_collections   enable row level security;
alter table public.availability_blocks   enable row level security;
alter table public.bookings              enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.reviews               enable row level security;
alter table public.payments              enable row level security;
alter table public.notifications         enable row level security;
alter table public.blog_posts            enable row level security;

-- ============================================================================
-- profiles
--   * anyone (incl. anon) may read profiles — the public view limits columns;
--     the table itself allows row read so host cards render. Sensitive writes
--     are gated: a user may update only their own row, and may not self-promote
--     to admin (role change to admin is blocked at the policy level).
-- ============================================================================
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role <> 'admin')  -- cannot self-promote to admin
  );

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete using (public.is_admin());

-- Public-read of limited host fields only (no phone, no role flags downstream).
create or replace view public.public_host_profiles as
  select id, full_name, avatar_url, bio, identity_verified, created_at
  from public.profiles;

comment on view public.public_host_profiles is
  'Limited, public-safe projection of profiles for host cards.';

-- ============================================================================
-- listings — published are public-read; hosts manage their own; admins all.
-- ============================================================================
drop policy if exists listings_select_published on public.listings;
create policy listings_select_published on public.listings
  for select using (
    status = 'published'
    or host_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists listings_insert_host on public.listings;
create policy listings_insert_host on public.listings
  for insert with check (host_id = auth.uid() or public.is_admin());

drop policy if exists listings_update_host on public.listings;
create policy listings_update_host on public.listings
  for update
  using (host_id = auth.uid() or public.is_admin())
  with check (host_id = auth.uid() or public.is_admin());

drop policy if exists listings_delete_host on public.listings;
create policy listings_delete_host on public.listings
  for delete using (host_id = auth.uid() or public.is_admin());

-- ============================================================================
-- listing_images — readable if the parent listing is readable; host writes.
-- ============================================================================
drop policy if exists listing_images_select on public.listing_images;
create policy listing_images_select on public.listing_images
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and (l.status = 'published' or l.host_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists listing_images_write on public.listing_images;
create policy listing_images_write on public.listing_images
  for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

-- ============================================================================
-- amenities — public-read; admins manage.
-- ============================================================================
drop policy if exists amenities_select_public on public.amenities;
create policy amenities_select_public on public.amenities
  for select using (true);

drop policy if exists amenities_admin_write on public.amenities;
create policy amenities_admin_write on public.amenities
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- listing_amenities — read if parent listing readable; host writes.
-- ============================================================================
drop policy if exists listing_amenities_select on public.listing_amenities;
create policy listing_amenities_select on public.listing_amenities
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_amenities.listing_id
        and (l.status = 'published' or l.host_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists listing_amenities_write on public.listing_amenities;
create policy listing_amenities_write on public.listing_amenities
  for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

-- ============================================================================
-- collections + listing_collections — public-read; admins curate.
-- ============================================================================
drop policy if exists collections_select_public on public.collections;
create policy collections_select_public on public.collections
  for select using (true);

drop policy if exists collections_admin_write on public.collections;
create policy collections_admin_write on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists listing_collections_select_public on public.listing_collections;
create policy listing_collections_select_public on public.listing_collections
  for select using (true);

drop policy if exists listing_collections_admin_write on public.listing_collections;
create policy listing_collections_admin_write on public.listing_collections
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- availability_blocks
--   read: public for published listings (calendar display) + host + admin
--   write: host of the listing or admin (system writes go through service-role)
-- ============================================================================
drop policy if exists availability_blocks_select on public.availability_blocks;
create policy availability_blocks_select on public.availability_blocks
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = availability_blocks.listing_id
        and (l.status = 'published' or l.host_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists availability_blocks_write on public.availability_blocks;
create policy availability_blocks_write on public.availability_blocks
  for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

-- ============================================================================
-- bookings
--   guests: read/write their own; hosts: read bookings for their listings and
--   update status (approve/decline) on them; admins: all.
--   (The service uses the service-role key for cross-cutting transitions; these
--    policies cover direct client access.)
-- ============================================================================
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings
  for select using (
    guest_id = auth.uid()
    or host_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists bookings_insert_guest on public.bookings;
create policy bookings_insert_guest on public.bookings
  for insert with check (guest_id = auth.uid() or public.is_admin());

-- Guests may update their own booking (e.g. cancel); hosts may update bookings
-- on their listings (approve/decline). with-check keeps the row owned/hosted.
drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings
  for update
  using (guest_id = auth.uid() or host_id = auth.uid() or public.is_admin())
  with check (guest_id = auth.uid() or host_id = auth.uid() or public.is_admin());

drop policy if exists bookings_admin_delete on public.bookings;
create policy bookings_admin_delete on public.bookings
  for delete using (public.is_admin());

-- ============================================================================
-- booking_status_history — read if you can see the booking; inserts happen via
-- the trigger (security definer), so no client INSERT policy is granted.
-- ============================================================================
drop policy if exists booking_status_history_select on public.booking_status_history;
create policy booking_status_history_select on public.booking_status_history
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_status_history.booking_id
        and (b.guest_id = auth.uid() or b.host_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- conversations — visible to its guest/host; either party may start one.
-- ============================================================================
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select using (
    guest_id = auth.uid() or host_id = auth.uid() or public.is_admin()
  );

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (
    guest_id = auth.uid() or host_id = auth.uid() or public.is_admin()
  );

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  for update
  using (guest_id = auth.uid() or host_id = auth.uid() or public.is_admin())
  with check (guest_id = auth.uid() or host_id = auth.uid() or public.is_admin());

-- ============================================================================
-- messages — readable/insertable by the conversation's participants only.
--   A sender may mark messages read (update read_at) on their conversations.
-- ============================================================================
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.guest_id = auth.uid() or c.host_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.guest_id = auth.uid() or c.host_id = auth.uid())
    )
  );

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.guest_id = auth.uid() or c.host_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.guest_id = auth.uid() or c.host_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- reviews — public-read for published listings; the reviewer (guest of a
-- completed booking) may write their own; admins all.
-- ============================================================================
drop policy if exists reviews_select_public on public.reviews;
create policy reviews_select_public on public.reviews
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = reviews.listing_id
        and (l.status = 'published' or l.host_id = auth.uid())
    )
    or reviewer_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists reviews_insert_reviewer on public.reviews;
create policy reviews_insert_reviewer on public.reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.guest_id = auth.uid()
        and b.status = 'completed'
    )
  );

drop policy if exists reviews_update_owner on public.reviews;
create policy reviews_update_owner on public.reviews
  for update
  using (reviewer_id = auth.uid() or public.is_admin())
  with check (reviewer_id = auth.uid() or public.is_admin());

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete using (reviewer_id = auth.uid() or public.is_admin());

-- ============================================================================
-- payments — visible to the booking's guest/host/admin. Writes go through the
-- service-role key (gateway init + IPN), so no client write policy is granted.
-- ============================================================================
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and (b.guest_id = auth.uid() or b.host_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- notifications — a user reads/updates (mark read) only their own; admins all.
-- Inserts are produced server-side (service-role).
-- ============================================================================
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- blog_posts — published are public-read; admins manage all.
-- ============================================================================
drop policy if exists blog_posts_select_published on public.blog_posts;
create policy blog_posts_select_published on public.blog_posts
  for select using (status = 'published' or public.is_admin());

drop policy if exists blog_posts_admin_write on public.blog_posts;
create policy blog_posts_admin_write on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());
