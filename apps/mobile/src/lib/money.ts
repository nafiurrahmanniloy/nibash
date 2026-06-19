/**
 * money.ts — BDT formatting for the device (design.md §5).
 *
 * The shared `common.schema` validates the numeric money contract (whole taka,
 * integer, ≥0) but states that formatting (৳, thousands separators, Asia/Dhaka,
 * English v1) is a UI concern. Web has its own apps/web/src/lib/money.ts; this is the
 * mobile equivalent, typed against the shared `Money` type and fixed `CURRENCY` so
 * both platforms agree on the amount contract.
 */
import { CURRENCY, type Money } from '@nibash/shared/schemas';

const bdtFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** Format whole-taka `Money` as `৳12,500`. */
export function formatBdt(amount: Money): string {
  return `৳${bdtFormatter.format(amount)}`;
}

/** Currency code re-export for any UI that needs the literal. */
export { CURRENCY };
