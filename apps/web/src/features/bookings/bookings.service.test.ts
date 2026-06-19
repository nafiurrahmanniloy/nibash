/**
 * bookings.service.test.ts — starter test for THE booking state machine
 * (ARCHITECTURE.md §4: the booking state machine has a starter test).
 *
 * Verifies the single guarded transition function:
 *  - legal edges succeed for the correct actor;
 *  - illegal edges are rejected (ILLEGAL_TRANSITION);
 *  - wrong actor is rejected (FORBIDDEN);
 *  - confirm goes through the atomic repo path and re-checks availability.
 *
 * The repository is mocked so this is pure state-machine logic — no Supabase.
 * Runner-agnostic: uses node:test + node:assert (works under `node --test`).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Booking } from '@nibash/shared';

// Mock the repository BEFORE importing the service (node:test module mocking).
import { mock } from 'node:test';

const repoMock = {
  getBooking: mock.fn(),
  getListingForBooking: mock.fn(),
  getListingSummary: mock.fn(async () => ({
    id: 'listing-1',
    slug: 'cozy-stay',
    title: 'Cozy Stay',
    area: 'Gulshan',
    district: 'Dhaka',
    cover_url: null,
  })),
  checkOverlap: mock.fn(async () => false),
  createBooking: mock.fn(),
  updateBookingStatus: mock.fn(),
  insertStatusHistory: mock.fn(async () => ({})),
  insertAvailabilityBlock: mock.fn(async () => ({})),
  confirmBookingAtomic: mock.fn(),
  listGuestBookings: mock.fn(),
};

mock.module('./bookings.repository.js', { namedExports: repoMock });
mock.module('./bookings.notifications.js', {
  namedExports: { notifyBookingEvent: mock.fn(async () => undefined) },
});

const { transitionBooking } = await import('./bookings.service.js');

const baseBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking-1',
  listing_id: 'listing-1',
  guest_id: 'guest-1',
  host_id: 'host-1',
  check_in: '2026-07-01',
  check_out: '2026-07-04',
  guests: 2,
  nights: 3,
  base_amount: 9000,
  service_fee: 900,
  total_amount: 9900,
  status: 'requested',
  special_request: null,
  payment_id: null,
  created_at: '2026-06-20T00:00:00.000Z',
  updated_at: '2026-06-20T00:00:00.000Z',
  ...overrides,
});

test('host can approve a requested booking', async () => {
  repoMock.updateBookingStatus.mock.mockImplementationOnce(async () =>
    baseBooking({ status: 'approved' }),
  );
  const result = await transitionBooking(baseBooking(), 'approve', {
    id: 'host-1',
    role: 'host',
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.status, 'approved');
});

test('guest cannot approve (wrong actor → FORBIDDEN)', async () => {
  const result = await transitionBooking(baseBooking(), 'approve', {
    id: 'guest-1',
    role: 'guest',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, 'FORBIDDEN');
});

test('cannot confirm a requested booking (illegal edge)', async () => {
  const result = await transitionBooking(baseBooking(), 'payment_succeeded', {
    id: null,
    role: 'system',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, 'ILLEGAL_TRANSITION');
});

test('terminal state has no outgoing transitions', async () => {
  const result = await transitionBooking(
    baseBooking({ status: 'declined' }),
    'approve',
    { id: 'host-1', role: 'host' },
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, 'ILLEGAL_TRANSITION');
});

test('payment_succeeded confirms via the atomic repo path', async () => {
  repoMock.checkOverlap.mock.mockImplementationOnce(async () => false);
  repoMock.confirmBookingAtomic.mock.mockImplementationOnce(async () =>
    baseBooking({ status: 'confirmed' }),
  );
  const result = await transitionBooking(
    baseBooking({ status: 'payment_pending' }),
    'payment_succeeded',
    { id: null, role: 'system' },
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.status, 'confirmed');
  assert.equal(repoMock.confirmBookingAtomic.mock.callCount() >= 1, true);
});

test('confirm rejects when dates were taken during payment (CONFLICT)', async () => {
  repoMock.checkOverlap.mock.mockImplementationOnce(async () => true);
  const result = await transitionBooking(
    baseBooking({ status: 'payment_pending' }),
    'payment_succeeded',
    { id: null, role: 'system' },
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, 'CONFLICT');
});
