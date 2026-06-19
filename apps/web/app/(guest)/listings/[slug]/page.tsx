/**
 * Listing detail — server component (thin).
 * Fetches the listing via the listings feature action `getListingDetail(slug)`
 * (Result<ListingPublicDTO>); 404s when not found. Composes feature components:
 *   - ListingGallery, AmenityList, HostCard  (from @/features/listings)
 *   - BookingWidget                          (from @/features/bookings)
 * No Supabase / business logic here — only data fetch + layout composition.
 *
 * Reviews: the reviews feature (Phase 5) is not built yet, so the section renders an
 * empty-state placeholder; the reviews agent drops <ListingReviews listingId/> into
 * the marked slot when @/features/reviews lands.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getListingDetail,
  ListingGallery,
  AmenityList,
  HostCard,
} from '@/features/listings';
import { BookingWidget } from '@/features/bookings';

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getListingDetail(slug);
  if (!result.ok) return { title: 'Listing' };
  const listing = result.data;
  return {
    title: listing.title,
    description: listing.description?.slice(0, 160),
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const result = await getListingDetail(slug);
  if (!result.ok) notFound();

  const listing = result.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold text-content-primary md:text-3xl">
          {listing.title}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">
          {[listing.area, listing.district, listing.division]
            .filter(Boolean)
            .join(', ')}
        </p>
      </header>

      <ListingGallery images={listing.images} title={listing.title} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="about-heading">
            <h2
              id="about-heading"
              className="font-display text-xl font-bold text-content-primary"
            >
              About this place
            </h2>
            <p className="mt-3 whitespace-pre-line text-content-secondary">
              {listing.description}
            </p>
          </section>

          <section aria-labelledby="amenities-heading">
            <h2
              id="amenities-heading"
              className="font-display text-xl font-bold text-content-primary"
            >
              What this place offers
            </h2>
            <div className="mt-3">
              <AmenityList amenities={listing.amenities} />
            </div>
          </section>

          <section aria-labelledby="host-heading">
            <h2
              id="host-heading"
              className="font-display text-xl font-bold text-content-primary"
            >
              Meet your host
            </h2>
            <div className="mt-3">
              <HostCard host={listing.host} />
            </div>
          </section>

          <section aria-labelledby="reviews-heading">
            <h2
              id="reviews-heading"
              className="font-display text-xl font-bold text-content-primary"
            >
              Reviews
            </h2>
            <div className="mt-3">
              {/* Reviews feature (Phase 5) renders here once @/features/reviews
                  exports <ListingReviews listingId={listing.id} />. */}
              <p className="rounded-md border border-line-default bg-surface-raised p-6 text-sm text-content-secondary">
                No reviews yet for this stay.
              </p>
            </div>
          </section>
        </div>

        {/* Booking sidebar (sticky on desktop) */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BookingWidget listing={listing} />
        </aside>
      </div>
    </div>
  );
}
