/**
 * Popular Locations hub — /popular-locations.
 *
 * A grid of location cards (city, property count, rating, tag) linking into search.
 * Locations are demo content (no dedicated table yet); a real build would aggregate
 * distinct areas/districts with live counts behind a feature. Static route, so it
 * takes precedence over the dynamic /[category] segment.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { demoLocations } from '@/lib/demo/data';
import { locationToSlug } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Popular locations',
  description: 'Explore stays across Bangladesh by city and neighbourhood on Nibash.',
};

export default function PopularLocationsPage() {
  const locations = demoLocations();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl font-bold text-content-primary">
        Popular locations
      </h1>
      <p className="mt-1 text-content-secondary">
        Find stays across Bangladesh — from the capital’s neighbourhoods to the coast and
        the hills.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {locations.map((loc) => (
          <li key={loc.name}>
            <Link
              href={`/search?location=${encodeURIComponent(loc.query)}`}
              className="group flex h-full flex-col justify-between rounded-md border border-line-default bg-surface-raised p-4 shadow-soft-sm transition-shadow duration-instant hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-1.5 font-display text-lg font-bold text-content-primary">
                  <MapPin className="h-4 w-4 text-brand" aria-hidden="true" />
                  {loc.name}
                </span>
                <span className="flex items-center gap-1 text-sm text-content-secondary">
                  <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
                  {loc.rating.toFixed(1)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-content-muted">
                  {loc.count.toLocaleString()} stays
                </span>
                <span className="rounded-pill bg-surface-subtle px-2.5 py-1 text-xs font-medium text-brand">
                  {loc.tag}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
