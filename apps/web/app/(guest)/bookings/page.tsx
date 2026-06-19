/**
 * Guest bookings list — server component (thin).
 * Protected by middleware (auth required). Resolves the signed-in user via the auth
 * feature, fetches their bookings through the bookings feature service
 * (`listMyBookings`), and renders the resulting DTOs. No Supabase, no business logic
 * here — the service owns the query; this page maps DTOs to presentation only.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { BookingDTO, BookingStatusValue } from '@nibash/shared';
import { getCurrentUser } from '@/features/auth';
import { listMyBookings } from '@/features/bookings';
import { Badge, Card } from '@/components/ui';
import { formatBdt } from '@/lib/money';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Your bookings',
  description: 'Track your stay requests and confirmed bookings.',
};

/** Status → human label + badge variant (presentation only). */
const STATUS_META: Record<
  BookingStatusValue,
  { label: string; tone: 'brand' | 'accent' | 'neutral' | 'success' | 'danger' }
> = {
  requested: { label: 'Requested', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'accent' },
  payment_pending: { label: 'Payment pending', tone: 'accent' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'brand' },
  declined: { label: 'Declined', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

const focusRing =
  'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

function BookingRow({ booking }: { booking: BookingDTO }) {
  const status = STATUS_META[booking.status];
  const place = [booking.listing.area, booking.listing.district]
    .filter(Boolean)
    .join(', ');

  return (
    <li>
      <Link
        href={`/listings/${booking.listing.slug}`}
        className={cn('block', focusRing)}
      >
        <Card
          interactive
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-content-primary">
              {booking.listing.title}
            </p>
            {place ? (
              <p className="mt-0.5 truncate text-sm text-content-secondary">
                {place}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-content-secondary">
              {booking.checkIn} → {booking.checkOut} ·{' '}
              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'} ·{' '}
              {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
            <Badge tone={status.tone}>{status.label}</Badge>
            <span className="text-base font-bold text-price">
              {formatBdt(booking.totalAmount)}
            </span>
          </div>
        </Card>
      </Link>
    </li>
  );
}

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user.ok || !user.data) {
    redirect('/login?next=/bookings');
  }

  const result = await listMyBookings(user.data.id);
  const bookings = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="font-display text-2xl font-bold text-content-primary">
        Your bookings
      </h1>

      <div className="mt-6">
        {bookings.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-content-secondary">
              You have no bookings yet.
            </p>
            <Link
              href="/search"
              className={cn(
                'mt-3 inline-block text-brand underline-offset-2 hover:underline',
                'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              )}
            >
              Explore stays
            </Link>
          </Card>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
