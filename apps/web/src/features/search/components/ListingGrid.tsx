/**
 * ListingGrid — responsive grid of ListingCards with empty + loading states.
 *
 * Not itself interactive; the cards inside carry the seven-state matrix. This
 * component owns the data-driven edge cases (design.md §5):
 *   loading  → renders ListingCardSkeleton tiles (no CLS, same footprint)
 *   empty    → message + optional action slot
 *   default  → the card grid
 * Responsive at sm/md/lg/xl with stable column counts.
 */
import type { ListingCardDTO } from '@nibash/shared';
import { ListingCard, ListingCardSkeleton } from '@/features/listings';

export interface ListingGridProps {
  listings: ListingCardDTO[];
  loading?: boolean;
  /** Number of skeleton tiles while loading. */
  skeletonCount?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Optional CTA shown in the empty state (e.g. "Clear filters"). */
  emptyAction?: React.ReactNode;
  favoriteIds?: ReadonlySet<string>;
  onToggleFavorite?: (listingId: string, next: boolean) => void;
}

export function ListingGrid({
  listings,
  loading = false,
  skeletonCount = 8,
  emptyTitle = 'No stays found',
  emptyMessage = 'Try widening your dates, price range, or location.',
  emptyAction,
  favoriteIds,
  onToggleFavorite,
}: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md bg-surface-raised p-6 text-center shadow-soft-sm">
        <p className="text-xl font-semibold text-content-primary">{emptyTitle}</p>
        <p className="text-base text-content-secondary">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favoriteIds?.has(listing.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
