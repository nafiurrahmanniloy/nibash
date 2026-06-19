/**
 * Search results — server component (thin).
 * Reads URL searchParams, validates them with the shared `searchParamsSchema`
 * (boundary validation, ARCHITECTURE.md §4), fetches results via the search feature
 * action `searchListings`, and composes <SearchFilters/> (client URL glue) +
 * <ListingGrid/> (presentational). No Supabase, no business logic — the service does
 * the query.
 */
import type { Metadata } from 'next';
import { searchParamsSchema, type SearchParams } from '@travela/shared';
import { searchListings, ListingGrid } from '@/features/search';
import { SearchFilters } from '@/components/search/SearchFilters';

export const metadata: Metadata = {
  title: 'Search stays',
  description: 'Filter stays by location, dates, guests, price, and type.',
};

/** Validate the URL; fall back to schema defaults so the page never throws. */
function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchParams {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    flat[key] = Array.isArray(value) ? (value[0] ?? '') : value;
  }
  const parsed = searchParamsSchema.safeParse(flat);
  return parsed.success ? parsed.data : searchParamsSchema.parse({});
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);

  const result = await searchListings(params);
  const page = result.ok
    ? result.data
    : { items: [], page: 1, pageSize: params.pageSize, total: 0, totalPages: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="font-display text-2xl font-bold text-content-primary">
        {page.total > 0
          ? `${page.total} ${page.total === 1 ? 'stay' : 'stays'}`
          : 'Search stays'}
      </h1>

      <div className="mt-4">
        <SearchFilters params={params} />
      </div>

      <div className="mt-6">
        <ListingGrid listings={page.items} />
      </div>
    </div>
  );
}
