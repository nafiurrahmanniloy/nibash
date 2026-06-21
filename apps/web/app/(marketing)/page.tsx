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
import Link from 'next/link';
import { ShieldCheck, Wallet, Headphones, BadgeCheck, Apple, Play } from 'lucide-react';
import { getNewArrivals } from '@/features/listings';
import { getCollections, ListingGrid, CollectionBand } from '@/features/search';
import { HomeSearchBar } from '@/components/search/HomeSearchBar';
import { HomeCategoryChips } from '@/components/search/HomeCategoryChips';

const WHY_US = [
  { icon: BadgeCheck, title: 'Verified stays', body: 'Every host and listing is reviewed before it goes live.' },
  { icon: Wallet, title: 'Fair BDT pricing', body: 'Clear prices in taka. Pay securely only when a host confirms.' },
  { icon: ShieldCheck, title: 'Secure booking', body: 'Request-to-book with protected payments and a clear cancellation policy.' },
  { icon: Headphones, title: '24/7 support', body: 'Phone, WhatsApp, and email whenever your trip needs a hand.' },
];

export const revalidate = 300;

export default async function HomePage() {
  const [arrivalsResult, collectionsResult] = await Promise.all([
    getNewArrivals({ limit: 12 }),
    getCollections({ perCollection: 12 }),
  ]);

  const newArrivals = arrivalsResult.ok ? arrivalsResult.data : [];
  const collections = collectionsResult.ok ? collectionsResult.data : [];

  return (
    <div className="page-shell pb-16">
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

      {/* Why choose us */}
      <section className="py-10" aria-labelledby="why-heading">
        <h2
          id="why-heading"
          className="mb-6 font-display text-2xl font-bold text-content-primary"
        >
          Why choose Nibash
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-md border border-line-default bg-surface-raised p-5 shadow-soft-sm"
            >
              <Icon className="h-7 w-7 text-brand" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-content-primary">{title}</h3>
              <p className="mt-1 text-sm text-content-secondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App download */}
      <section
        className="my-6 overflow-hidden rounded-md bg-brand px-6 py-10 md:px-10"
        aria-labelledby="app-heading"
      >
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2
              id="app-heading"
              className="font-display text-2xl font-bold text-content-inverse md:text-3xl"
            >
              Book on the go with the Nibash app
            </h2>
            <p className="mt-2 text-content-inverse/85">
              Browse stays, message hosts, and manage your trips from your phone. Coming
              soon to Android and iOS.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-pill bg-surface-base px-4 py-2.5 text-sm font-semibold text-content-primary">
              <Play className="h-5 w-5 fill-content-primary" aria-hidden="true" />
              Google Play
            </span>
            <span className="inline-flex items-center gap-2 rounded-pill bg-surface-base px-4 py-2.5 text-sm font-semibold text-content-primary">
              <Apple className="h-5 w-5" aria-hidden="true" />
              App Store
            </span>
          </div>
        </div>
      </section>

      {/* Browse the blog */}
      <section className="py-6">
        <Link href="/blogs" className="font-semibold text-brand hover:underline">
          Read travel guides on the Nibash blog →
        </Link>
      </section>
    </div>
  );
}
