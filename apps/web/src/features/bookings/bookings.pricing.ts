/**
 * bookings.pricing.ts — pure pricing math for a booking (no I/O, no Supabase).
 *
 * One place that turns (pricePerDay, nights) into the full price breakdown so the
 * BookingWidget preview and the server-side booking creation agree to the taka.
 * BDT whole-taka integers only (common.schema money rule).
 */
import { priceBreakdownSchema, type PriceBreakdown } from '@travela/shared';

/** Platform service fee: 10% of base, rounded to whole taka. Tune in one place. */
export const SERVICE_FEE_RATE = 0.1;

/** Whole nights between two YYYY-MM-DD dates (check-out exclusive). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Compute the validated price breakdown for a stay. */
export function priceBooking(
  pricePerDay: number,
  checkIn: string,
  checkOut: string,
): PriceBreakdown {
  const nights = nightsBetween(checkIn, checkOut);
  const baseAmount = pricePerDay * nights;
  const serviceFee = Math.round(baseAmount * SERVICE_FEE_RATE);
  const totalAmount = baseAmount + serviceFee;
  return priceBreakdownSchema.parse({
    pricePerDay,
    nights,
    baseAmount,
    serviceFee,
    totalAmount,
    currency: 'BDT',
  });
}
