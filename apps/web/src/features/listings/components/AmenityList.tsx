/**
 * AmenityList — non-interactive presentation of a listing's amenities.
 *
 * Not an interactive control (no seven-state matrix needed) — it's a static list.
 * Handles: empty state (message), long lists (optional show-all is a parent concern),
 * and icon fallback when an amenity has no icon_url. Icons are decorative
 * (aria-hidden); the amenity name carries the meaning.
 */
import Image from 'next/image';
import type { AmenityDTO } from '@travela/shared';

export interface AmenityListProps {
  amenities: AmenityDTO[];
}

export function AmenityList({ amenities }: AmenityListProps) {
  if (amenities.length === 0) {
    return <p className="text-sm text-content-muted">No amenities listed yet.</p>;
  }

  return (
    <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {amenities.map((a) => (
        <li key={a.id} className="flex items-center gap-3 text-base text-content-primary">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-subtle text-content-secondary"
          >
            {a.iconUrl ? (
              <Image src={a.iconUrl} alt="" width={20} height={20} className="h-5 w-5" />
            ) : (
              <DotIcon />
            )}
          </span>
          <span className="truncate">{a.name}</span>
        </li>
      ))}
    </ul>
  );
}

function DotIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
