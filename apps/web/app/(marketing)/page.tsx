/**
 * Home — the marketing landing surface (server component).
 *
 * Thin composition only (ARCHITECTURE.md): fetches via feature server actions
 * (NO Supabase, NO business logic here) and passes plain DTO data down. Sections:
 * hero with the search bar + category chips, curated collection bands, and a
 * new-arrivals grid.
 *
 * Data:
 *  - new arrivals  → listings action `getNewArrivals`     (Result<ListingCardDTO[]>)
 *  - collections   → search action  `getCollections`      (Result<CollectionBandDTO[]>)
 * The interactive search bar / chips are wrapped by thin client containers
 * (src/components/search/*) that translate UI events into /search URLs.
 */
import { getNewArrivals } from '@/features/listings';
import { getCollections, ListingGrid, CollectionBand } from '@/features/search';
import { HomeSearchBar } from '@/components/search/HomeSearchBar';
import { HomeCategoryChips } from '@/components/search/HomeCategoryChips';

export const revalidate = 300;

export default async function HomePage() {
  const [arrivalsResult, collectionsResult] = await Promise.all([
    getNewArrivals({ limit: 12 }),
    getCollections({ perCollection: 12 }),
  ]);

  const newArrivals = arrivalsResult.ok ? arrivalsResult.data : [];
  const collections = collectionsResult.ok ? collectionsResult.data : [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
      {/* Hero */}
      <section className="py-10 md:py-16" aria-labelledby="hero-heading">
        <h1
          id="hero-heading"
          className="font-display text-3xl font-bold text-content-primary md:text-4xl"
        >
          Stay anywhere in Bangladesh
        </h1>
        <p className="mt-3 max-w-2xl text-md text-content-secondary">
          Apartments, private rooms, villas, and resorts — request to book, pay
          securely, and stay with confidence.
        </p>
        <div className="mt-6">
          <HomeSearchBar />
        </div>
        <div className="mt-6">
          <HomeCategoryChips />
        </div>
      </section>

      {/* Curated collection bands */}
      {collections.length > 0 ? (
        <div className="space-y-10 py-6">
          {collections.map((collection) => (
            <CollectionBand
              key={collection.slug}
              title={collection.name}
              description={collection.description}
              listings={collection.listings}
              href={`/search?collection=${collection.slug}`}
            />
          ))}
        </div>
      ) : null}

      {/* New arrivals */}
      <section className="py-6" aria-labelledby="new-arrivals-heading">
        <h2
          id="new-arrivals-heading"
          className="mb-4 font-display text-2xl font-bold text-content-primary"
        >
          New arrivals
        </h2>
        <ListingGrid
          listings={newArrivals}
          emptyTitle="No new stays yet"
          emptyMessage="Check back soon for fresh places to stay."
        />
      </section>
    </div>
  );
}
