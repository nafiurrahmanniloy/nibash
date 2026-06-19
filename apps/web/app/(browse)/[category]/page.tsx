/**
 * Browse-by-type — /apartments, /rooms, /hotels, /resorts, /villas, /studios.
 *
 * Thin server component: validate the type slug → enum (404 on unknown), fetch via
 * the search feature filtered by category, and compose the grid + a city quick-links
 * strip. Static routes (/about, /blogs, …) take precedence over this dynamic segment.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchListings, ListingGrid } from '@/features/search';
import { slugToCategory, CATEGORY_LABEL, locationToSlug } from '@/lib/categories';
import { demoLocations } from '@/lib/demo/data';

type Params = { category: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = slugToCategory(category);
  if (!cat) return { title: 'Browse stays' };
  const label = CATEGORY_LABEL[cat].many;
  return {
    title: `${label} across Bangladesh`,
    description: `Browse ${label.toLowerCase()} to book on Nibash — verified stays with BDT pricing.`,
  };
}

export default async function BrowseCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category } = await params;
  const cat = slugToCategory(category);
  if (!cat) notFound();

  const result = await searchListings({ category: cat, pageSize: 24 });
  const items = result.ok ? result.data.items : [];
  const total = result.ok ? result.data.total : 0;
  const label = CATEGORY_LABEL[cat].many;
  const cities = demoLocations().slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-content-muted">
        <Link href="/" className="hover:text-content-primary">
          Home
        </Link>{' '}
        / <span className="text-content-secondary">{label}</span>
      </nav>

      <h1 className="mt-2 font-display text-3xl font-bold text-content-primary">
        {label} across Bangladesh
      </h1>
      <p className="mt-1 text-content-secondary">
        {total} {total === 1 ? 'stay' : 'stays'} available · request to book, pay securely.
      </p>

      {/* City quick-links (browse this type by location) */}
      <div className="mt-5 flex flex-wrap gap-2">
        {cities.map((c) => (
          <Link
            key={c.name}
            href={`/${category}/${locationToSlug(c.query)}`}
            className="rounded-pill border border-line-default bg-surface-raised px-3 py-1.5 text-sm text-content-secondary transition-colors duration-instant hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {CATEGORY_LABEL[cat].many} in {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ListingGrid
          listings={items}
          emptyTitle={`No ${label.toLowerCase()} yet`}
          emptyMessage="Try another type or location."
        />
      </div>
    </div>
  );
}
