'use client';
/**
 * BookingWidget — dates + guests + price breakdown + "Request to book" (design.md §4.4).
 *
 * Seven states (design.md §3):
 *   default       base tokens; CTA disabled until a valid range is chosen.
 *   hover/active  ui/Button + ui/Input token treatments.
 *   focus-visible visible ring on every control (ui primitives).
 *   disabled      CTA disabled until valid dates/guests; fields disabled while loading.
 *   loading       availability check / submit shows spinner on the CTA (aria-busy),
 *                 width preserved, controls non-interactive.
 *   error         inline message (role="alert", aria-describedby on the form) for
 *                 invalid range / unavailable dates / server failure.
 *
 * Price math reuses the same pure `priceBooking` the server uses, so the preview and
 * the persisted booking agree to the taka. Submit calls the requestBooking action.
 */
import { useId, useMemo, useState, useTransition } from 'react';
import type { PriceBreakdown } from '@nibash/shared';
import { Button, Input } from '@/components/ui';
import { formatBdt } from '@/lib/money';
import { requestBooking } from '../actions.js';
import { priceBooking, nightsBetween } from '../bookings.pricing.js';

export interface BookingWidgetProps {
  listingId: string;
  pricePerDay: number;
  maxGuests: number;
  minNights: number;
  /** Called with the created booking id on a successful request. */
  onRequested?: (bookingId: string) => void;
}

export function BookingWidget({
  listingId,
  pricePerDay,
  maxGuests,
  minNights,
  onRequested,
}: BookingWidgetProps) {
  const errorId = useId();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [isPending, startTransition] = useTransition();

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );

  const validRange = Boolean(checkIn && checkOut) && nights >= 1;
  const meetsMinNights = nights >= minNights;
  const canSubmit = validRange && meetsMinNights && guests >= 1 && guests <= maxGuests;

  const breakdown: PriceBreakdown | null = useMemo(() => {
    if (!validRange) return null;
    return priceBooking(pricePerDay, checkIn, checkOut);
  }, [validRange, pricePerDay, checkIn, checkOut]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validRange) {
      setError('Choose a valid check-in and check-out date.');
      return;
    }
    if (!meetsMinNights) {
      setError(`This stay has a minimum of ${minNights} night(s).`);
      return;
    }
    if (guests < 1 || guests > maxGuests) {
      setError(`Choose between 1 and ${maxGuests} guests.`);
      return;
    }

    startTransition(async () => {
      const result = await requestBooking({
        listingId,
        checkIn,
        checkOut,
        guests,
      });
      if (result.ok) {
        setRequested(true);
        onRequested?.(result.data.id);
        return;
      }
      setError(result.error.message);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isPending}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-4 rounded-md bg-surface-raised p-4 shadow-soft-md"
    >
      <p className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold text-price">
          {formatBdt(pricePerDay)}
        </span>
        <span className="text-sm text-content-muted">/night</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Check-in"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          disabled={isPending}
        />
        <Input
          label="Check-out"
          type="date"
          value={checkOut}
          min={checkIn || undefined}
          onChange={(e) => setCheckOut(e.target.value)}
          disabled={isPending}
        />
      </div>

      <Input
        label="Guests"
        type="number"
        min={1}
        max={maxGuests}
        value={guests}
        onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
        disabled={isPending}
        hint={`Up to ${maxGuests} guests`}
      />

      {breakdown ? (
        <dl className="flex flex-col gap-2 border-t border-line-default pt-3 text-base">
          <div className="flex items-center justify-between text-content-secondary">
            <dt>
              {formatBdt(breakdown.pricePerDay)} × {breakdown.nights} night
              {breakdown.nights === 1 ? '' : 's'}
            </dt>
            <dd className="text-content-primary">{formatBdt(breakdown.baseAmount)}</dd>
          </div>
          <div className="flex items-center justify-between text-content-secondary">
            <dt>Service fee</dt>
            <dd className="text-content-primary">{formatBdt(breakdown.serviceFee)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-line-default pt-2">
            <dt className="font-semibold text-content-primary">Total</dt>
            <dd className="font-display text-lg font-bold text-price">
              {formatBdt(breakdown.totalAmount)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-content-muted">
          Add your dates to see the total price.
        </p>
      )}

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-content-danger">
          {error}
        </p>
      ) : null}

      {requested ? (
        <p
          role="status"
          className="rounded-sm bg-surface-subtle px-3 py-3 text-sm text-content-primary"
        >
          <span className="font-semibold text-brand">Request sent.</span> The host will
          review your dates and confirm shortly — you’ll see it under Trips.
        </p>
      ) : (
        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={!canSubmit}
          className="w-full"
        >
          Request to book
        </Button>
      )}
    </form>
  );
}
