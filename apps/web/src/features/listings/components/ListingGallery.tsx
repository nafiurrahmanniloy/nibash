'use client';
/**
 * ListingGallery — listing detail image gallery (design.md radius.md, lazy).
 *
 * Seven states (design.md §3) for the thumbnail controls:
 *   default  base tokens (rounded-md images)
 *   hover    thumbnail opacity lift (motion-instant)
 *   focus-visible  ring on each thumbnail button
 *   active   selected thumbnail ring (border-brand)
 *   disabled n/a (a gallery thumb is always actionable while present)
 *   loading  <GallerySkeleton/> (no CLS)
 *   error    per-image onError → neutral placeholder (no broken-image icon)
 * Empty state: single placeholder tile + message.
 */
import { useState } from 'react';
import Image from 'next/image';
import type { ListingImageDTO } from '@nibash/shared';
import { cn } from '@/lib/cn';

export interface ListingGalleryProps {
  images: ListingImageDTO[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [erroredIds, setErroredIds] = useState<Set<string>>(new Set());

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-md bg-surface-subtle text-sm text-content-muted">
        No photos yet
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];
  const activeErrored = erroredIds.has(active.id);

  function markErrored(id: string) {
    setErroredIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-subtle">
        {!activeErrored ? (
          <Image
            src={active.url}
            alt={`${title} — photo ${activeIndex + 1} of ${images.length}`}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority={activeIndex === 0}
            onError={() => markErrored(active.id)}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-content-muted">
            Photo unavailable
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" role="list">
          {images.map((img, i) => {
            const selected = i === activeIndex;
            return (
              <li key={img.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show photo ${i + 1} of ${images.length}`}
                  aria-current={selected ? 'true' : undefined}
                  className={cn(
                    'relative h-16 w-24 overflow-hidden rounded-sm bg-surface-subtle transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                    selected ? 'ring-2 ring-brand' : 'opacity-80',
                  )}
                >
                  {!erroredIds.has(img.id) ? (
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="96px"
                      loading="lazy"
                      onError={() => markErrored(img.id)}
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-content-muted">
                      —
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="aspect-[16/9] w-full animate-pulse rounded-md bg-surface-subtle" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 w-24 animate-pulse rounded-sm bg-surface-subtle" />
        ))}
      </div>
    </div>
  );
}
