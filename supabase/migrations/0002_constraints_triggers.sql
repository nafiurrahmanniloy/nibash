-- ============================================================================
-- 0002_constraints_triggers.sql — Integrity rules + automation
-- ----------------------------------------------------------------------------
-- Adds, on top of 0001:
--   * deferred cross-table FKs that would have created a cycle in 0001
--     (bookings.payment_id ↔ payments, availability_blocks.booking_id ↔ bookings)
--   * the EXCLUDE USING gist double-booking guard (BUILD-PLAN §3)
--   * a shared set_updated_at() trigger function + triggers on every table
--     that carries updated_at
--   * a status-change trigger that appends a booking_status_history row on
--     every bookings.status transition (BUILD-PLAN §4)
-- Idempotent-friendly: guards on constraints/triggers; CREATE OR REPLACE fns.
-- ============================================================================

-- ── Late FKs (broke a creation cycle in 0001) ───────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'availability_blocks_booking_fk'
  ) then
    alter table public.availability_blocks
      add constraint availability_blocks_booking_fk
      foreign key (booking_id) references public.bookings (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bookings_payment_fk'
  ) then
    alter table public.bookings
      add constraint bookings_payment_fk
      foreign key (payment_id) references public.payments (id) on delete set null;
  end if;
end
$$;

-- ============================================================================
-- Double-booking guard (BUILD-PLAN §3)
-- ----------------------------------------------------------------------------
-- No two *confirmed* bookings for the same listing may have overlapping date
-- ranges. daterange is half-open '[)', so a checkout date can equal the next
-- guest's check-in. btree_gist (enabled in 0001) lets gist mix the equality
-- operator on listing_id with the && overlap operator on the range.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    alter table public.bookings
      add constraint bookings_no_overlap
      exclude using gist (
        listing_id with =,
        daterange(check_in, check_out, '[)') with &&
      )
      where (status = 'confirmed');
  end if;
end
$$;

-- ============================================================================
-- updated_at automation
-- ----------------------------------------------------------------------------
-- One trigger function reused everywhere: stamps NEW.updated_at on UPDATE.
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger fn: refreshes updated_at to now().';

-- Attach to every table that has an updated_at column.
do $$
declare
  tbl text;
  tables text[] := array[
    'profiles', 'listings', 'collections', 'bookings',
    'reviews', 'payments', 'blog_posts'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I', tbl
    );
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', tbl
    );
  end loop;
end
$$;

-- ============================================================================
-- Booking status-history automation (BUILD-PLAN §4)
-- ----------------------------------------------------------------------------
-- On INSERT: record the initial status (from_status NULL).
-- On UPDATE where status actually changed: record the transition.
-- The actor is read from a per-transaction GUC the service sets:
--   select set_config('app.actor_id', '<uuid>', true);
-- If unset, actor_id is NULL (e.g. system/IPN-driven transitions).
-- This guarantees an audit trail even if a write bypasses the service layer.
-- ============================================================================
create or replace function public.log_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  begin
    v_actor := nullif(current_setting('app.actor_id', true), '')::uuid;
  exception when others then
    v_actor := null;
  end;

  if tg_op = 'INSERT' then
    insert into public.booking_status_history
      (booking_id, from_status, to_status, actor_id, note)
    values (new.id, null, new.status, coalesce(v_actor, new.guest_id), 'created');
    return new;
  end if;

  -- UPDATE: only log when the status column changed.
  if new.status is distinct from old.status then
    insert into public.booking_status_history
      (booking_id, from_status, to_status, actor_id, note)
    values (new.id, old.status, new.status, v_actor, null);
  end if;
  return new;
end;
$$;

comment on function public.log_booking_status_change() is
  'Appends a booking_status_history row on booking insert and status change.';

drop trigger if exists log_booking_status_change on public.bookings;
create trigger log_booking_status_change
  after insert or update of status on public.bookings
  for each row execute function public.log_booking_status_change();

-- ============================================================================
-- new auth user → profile (Phase 0 auth)
-- ----------------------------------------------------------------------------
-- Every auth.users row gets a matching profiles row so the app always has a
-- profile to read. Metadata (full_name/avatar) is pulled from the OAuth/signup
-- payload when present.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a public.profiles row when an auth.users row is inserted.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
