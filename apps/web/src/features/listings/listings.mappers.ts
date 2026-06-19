/**
 * listings.mappers.ts — pure row→DTO mappers for the listings domain.
 *
 * Kept in one place because both the listings service and the search service
 * compose listing DTOs (DRY). NO Supabase, NO business rules — just shape
 * translation from internal rows to the public zod DTOs, with internal/host-private
 * fields dropped. Every mapper validates with the schema so a leak fails loudly.
 */
import {
  amenityDTOSchema,
  listingCardDTOSchema,
  listingHostDTOSchema,
  listingImageDTOSchema,
  listingPublicDTOSchema,
  type Amenity,
  type AmenityDTO,
  type ListingCardDTO,
  type ListingHostDTO,
  type ListingImage,
  type ListingImageDTO,
  type ListingPublicDTO,
  type Profile,
} from '@nibash/shared';
import type {
  ListingRatingRow,
  PublicListingRow,
} from './listings.repository.js';

export function toListingImageDTO(row: ListingImage): ListingImageDTO {
  return listingImageDTOSchema.parse({
    id: row.id,
    url: row.url,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  });
}

export function toAmenityDTO(row: Amenity): AmenityDTO {
  return amenityDTOSchema.parse({
    id: row.id,
    name: row.name,
    iconUrl: row.icon_url,
    category: row.category,
  });
}

export function toListingHostDTO(row: Profile): ListingHostDTO {
  return listingHostDTOSchema.parse({
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    identityVerified: row.identity_verified,
  });
}

export interface ListingDetailParts {
  listing: PublicListingRow;
  images: ListingImage[];
  amenities: Amenity[];
  host: Profile;
  rating: ListingRatingRow;
}

/** Compose the full public listing DTO from its parts. */
export function toListingPublicDTO(parts: ListingDetailParts): ListingPublicDTO {
  const { listing, images, amenities, host, rating } = parts;
  return listingPublicDTOSchema.parse({
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    description: listing.description,
    placeType: listing.place_type,
    category: listing.category,
    division: listing.division,
    district: listing.district,
    area: listing.area,
    lat: listing.lat,
    lng: listing.lng,
    maxGuests: listing.max_guests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    baths: listing.baths,
    pricePerDay: listing.price_per_day,
    minNights: listing.min_nights,
    rules: listing.rules,
    images: images.map(toListingImageDTO),
    amenities: amenities.map(toAmenityDTO),
    host: toListingHostDTO(host),
    ratingAverage: rating.count > 0 ? Number(rating.average.toFixed(2)) : null,
    reviewCount: rating.count,
    createdAt: listing.created_at,
  });
}

/** Lightweight card DTO for grids/search results. */
export function toListingCardDTO(
  listing: PublicListingRow,
  coverImageUrl: string | null,
  rating: ListingRatingRow,
): ListingCardDTO {
  return listingCardDTOSchema.parse({
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    placeType: listing.place_type,
    category: listing.category,
    division: listing.division,
    district: listing.district,
    area: listing.area,
    pricePerDay: listing.price_per_day,
    ratingAverage: rating.count > 0 ? Number(rating.average.toFixed(2)) : null,
    reviewCount: rating.count,
    coverImageUrl,
  });
}
