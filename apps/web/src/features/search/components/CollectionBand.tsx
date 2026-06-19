/**
 * CollectionBand — a titled horizontal band of ListingCards (home page).
 *
 * Presentational; interactivity lives in the nested ListingCards (seven states there).
 * Owns its data-driven edges (design.md §5):
 *   loading  → skeleton tiles in a scroll row (no CLS)
 *   empty    → renders nothing (a band with no listings is omitted upstream, but we
 *              guard here too so it never shows an empty header)
 * Horizontal overflow scrolls (never silent cut); each card has a fixed min width.
 */
import type { ListingCardDTO } from '@nibash/shared';
import { ListingCard, ListingCardSkeleton } from '@/features/listings';

export interface CollectionBandProps {
  title: string;
  description?: string | null;
  listings: ListingCardDTO[];
  loading?: boolean;
  /** Optional "see all" link target for the collection. */
  href?: string;
}

export function CollectionBand({
  title,
  description,
  listings,
  loading = false,
  href,
}: CollectionBandProps) {
  if (!loading && listings.length === 0) return null;

  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold text-content-primary">{title}</h2>
          {description ? (
            <p className="mt-1 text-base text-content-secondary">{description}</p>
          ) : null}
        </div>
        {href ? (
          <a
            href={href}
            className="shrink-0 rounded-sm text-base font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            See all
          </a>
        ) : null}
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 pb-2 [scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[78%] shrink-0 snap-start sm:w-72">
                <ListingCardSkeleton />
              </div>
            ))
          : listings.map((listing) => (
              <div key={listing.id} className="w-[78%] shrink-0 snap-start sm:w-72">
                <ListingCard listing={listing} />
              </div>
            ))}
      </div>
    </section>
  );
}
