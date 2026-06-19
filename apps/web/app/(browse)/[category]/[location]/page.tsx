/**
 * Browse-by-type-and-location — /rooms/dhaka, /apartments/gulshan, …
 *
 * Mirrors the real Nibash URL model. Thin server component: validate the type slug,
 * derive the location filter from its slug, fetch via the search feature, render.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchListings, ListingGrid } from '@/features/search';
import { slugToCategory, CATEGORY_LABEL, locationFromSlug } from '@/lib/categories';

type Params = { category: string; location: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, location } = await params;
  const cat = slugToCategory(category);
  if (!cat) return { title: 'Browse stays' };
  const { label } = locationFromSlug(location);
  return {
    title: `${CATEGORY_LABEL[cat].many} in ${label}`,
    description: `Book ${CATEGORY_LABEL[cat].many.toLowerCase()} in ${label} on Nibash.`,
  };
}

export default async function BrowseCategoryLocationPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, location } = await params;
  const cat = slugToCategory(category);
  if (!cat) notFound();

  const { query, label } = locationFromSlug(location);
  const result = await searchListings({ category: cat, location: query, pageSize: 24 });
  const items = result.ok ? result.data.items : [];
  const total = result.ok ? result.data.total : 0;
  const typeLabel = CATEGORY_LABEL[cat].many;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-content-muted">
        <Link href="/" className="hover:text-content-primary">
          Home
        </Link>{' '}
        /{' '}
        <Link href={`/${category}`} className="hover:text-content-primary">
          {typeLabel}
        </Link>{' '}
        / <span className="text-content-secondary">{label}</span>
      </nav>

      <h1 className="mt-2 font-display text-3xl font-bold text-content-primary">
        {typeLabel} in {label}
      </h1>
      <p className="mt-1 text-content-secondary">
        {total} {total === 1 ? 'stay' : 'stays'} in {label}.
      </p>

      <div className="mt-8">
        <ListingGrid
          listings={items}
          emptyTitle={`No ${typeLabel.toLowerCase()} in ${label} yet`}
          emptyMessage="Try a nearby area or a different type."
          emptyAction={
            <Link
              href={`/${category}`}
              className="text-sm font-semibold text-brand hover:underline"
            >
              See all {typeLabel.toLowerCase()}
            </Link>
          }
        />
      </div>
    </div>
  );
}
