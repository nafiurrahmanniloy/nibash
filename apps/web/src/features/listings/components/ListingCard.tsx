'use client';
/**
 * ListingCard — the marketplace primitive (design.md §4.2).
 *
 * Anatomy: image (rounded-md, 4:3, lazy) · favorite toggle (top-right, 44px, own
 * focus ring, stopPropagation, aria-pressed) · title text-lg clamp-2 · area clamp-1
 * · RatingStars · price in text-price font-display bold + "/night" text-content-muted.
 * Whole card is ONE link; favorite is a nested button.
 *
 * Seven states (design.md §3):
 *   default  base tokens
 *   hover    card lifts shadow-soft-sm → shadow-soft-md (motion-instant)
 *   focus-visible  ring on the card link (focus-within) + own ring on favorite
 *   active   slight press handled by Button/link defaults
 *   disabled n/a for a link card; the favorite button supports disabled
 *   loading  use <ListingCardSkeleton/> (no CLS, rounded-md)
 *   error    image onError → neutral placeholder background (no broken icon)
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ListingCardDTO } from '@nibash/shared';
import { RatingStars, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatBdt } from '@/lib/money';

export interface ListingCardProps {
  listing: ListingCardDTO;
  /** Controlled favorite state; when omitted the card manages its own. */
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string, next: boolean) => void;
  className?: string;
}

function locationLabel(l: ListingCardDTO): string {
  return [l.area, l.district].filter(Boolean).join(', ') || l.division || 'Bangladesh';
}

export function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  className,
}: ListingCardProps) {
  const [internalFav, setInternalFav] = useState(false);
  const [imgError, setImgError] = useState(false);
  const favorited = isFavorite ?? internalFav;

  function handleFavorite(e: React.MouseEvent) {
    // Nested button inside a link: prevent navigation.
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    if (isFavorite === undefined) setInternalFav(next);
    onToggleFavorite?.(listing.id, next);
  }

  return (
    <article
      className={cn(
        'group relative rounded-md bg-surface-raised shadow-soft-sm transition-shadow duration-150 ease-out hover:shadow-soft-md focus-within:shadow-soft-md',
        className,
      )}
    >
      {/* Favorite toggle — nested above the link; 44px target, own focus ring. */}
      <button
        type="button"
        onClick={handleFavorite}
        aria-pressed={favorited}
        aria-label={favorited ? `Remove ${listing.title} from favorites` : `Add ${listing.title} to favorites`}
        className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-pill bg-surface-raised/90 text-content-secondary shadow-soft-sm transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 active:scale-95"
      >
        <HeartIcon filled={favorited} />
      </button>

      {/* Whole card is one link. */}
      <Link
        href={`/listings/${listing.slug}`}
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-surface-subtle">
          {listing.coverImageUrl && !imgError ? (
            <Image
              src={listing.coverImageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading="lazy"
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center bg-surface-subtle text-content-muted"
            >
              <HeartIcon filled={false} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-lg font-semibold text-content-primary">
            {listing.title}
          </h3>
          <p className="line-clamp-1 text-sm text-content-secondary">
            {locationLabel(listing)}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-sm">
            {listing.reviewCount > 0 ? (
              <RatingStars
                value={listing.ratingAverage ?? 0}
                count={listing.reviewCount}
                size="sm"
              />
            ) : (
              <span className="text-sm text-content-muted">New</span>
            )}
          </div>

          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-lg font-bold text-price">
              {formatBdt(listing.pricePerDay)}
            </span>
            <span className="text-sm text-content-muted">/night</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

/** Empty/loading state — same footprint, rounded-md, no layout shift. */
export function ListingCardSkeleton() {
  return (
    <div className="rounded-md bg-surface-raised p-0 shadow-soft-sm" aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-md" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-5 w-3/4 rounded-sm" />
        <Skeleton className="h-4 w-1/2 rounded-sm" />
        <Skeleton className="h-4 w-1/3 rounded-sm" />
        <Skeleton className="h-5 w-1/4 rounded-sm" />
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? 'text-accent' : ''}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}
