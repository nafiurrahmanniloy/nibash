/**
 * money.ts — BDT formatting (design.md §5 / BUILD-PLAN). Prices are stored as whole
 * taka integers (no paisa) per the shared money schema; this is the single place
 * that renders them with the ৳ symbol, English thousands separators, and Asia/Dhaka
 * assumptions. Components never hand-roll currency strings.
 */
import { CURRENCY } from '@nibash/shared';

const TAKA_SYMBOL = '৳';

/**
 * Use Intl for grouping but force our own symbol so the glyph is stable across
 * runtimes/locales (some environments render BDT as "Tk" or "BDT").
 */
const grouping = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 0,
  useGrouping: true,
});

/**
 * Format a whole-taka integer as `৳1,500`. Guards NaN/negative inputs to `৳0`.
 * Canonical name `formatBdt` (matches the casing components import); `formatBDT`
 * is kept as an alias so both spellings resolve.
 */
export function formatBdt(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${TAKA_SYMBOL}${grouping.format(Math.max(0, safe))}`;
}

/** Alias of {@link formatBdt}. */
export const formatBDT = formatBdt;

/** Per-night price label used on cards/widgets: `৳1,500 / night`. */
export function formatBdtPerNight(amount: number): string {
  return `${formatBdt(amount)} / night`;
}

/** Alias of {@link formatBdtPerNight}. */
export const formatBDTPerNight = formatBdtPerNight;

/** Currency code for any place that needs the ISO string (e.g. payment session). */
export const currencyCode = CURRENCY;
