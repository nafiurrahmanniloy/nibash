/**
 * listing.schema.ts — public Listing DTO + create-listing input.
 *
 * listingPublicDTO is the ONLY listing shape a client receives. It deliberately
 * omits host-private / internal fields (raw status workflow internals, audit
 * timestamps beyond what the UI needs, exact address until a booking is confirmed).
 * Repositories map DB rows → this DTO.
 */
import { z } from 'zod';
import { idSchema, isoDateTimeSchema, moneySchema } from './common.schema.js';

export const placeTypeSchema = z.enum(['entire', 'private', 'shared']);
export const listingCategorySchema = z.enum([
  'apartment',
  'room',
  'hotel',
  'resort',
  'villa',
  'studio',
]);
export const listingStatusSchema = z.enum(['draft', 'pending', 'published', 'suspended']);

/** A single gallery image as exposed to clients. */
export const listingImageDTOSchema = z.object({
  id: idSchema,
  url: z.string().url(),
  sortOrder: z.number().int().nonnegative(),
  isCover: z.boolean(),
});
export type ListingImageDTO = z.infer<typeof listingImageDTOSchema>;

/** Amenity as exposed to clients. */
export const amenityDTOSchema = z.object({
  id: idSchema,
  name: z.string(),
  iconUrl: z.string().url().nullable(),
  category: z.string().nullable(),
});
export type AmenityDTO = z.infer<typeof amenityDTOSchema>;

/** Compact host card shown on a listing (never the full private profile). */
export const listingHostDTOSchema = z.object({
  id: idSchema,
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  identityVerified: z.boolean(),
});
export type ListingHostDTO = z.infer<typeof listingHostDTOSchema>;

/**
 * Public listing DTO. Location is exposed at area/district/division granularity;
 * the exact street `address` is intentionally NOT included here (revealed only
 * after a confirmed booking, server-side).
 */
export const listingPublicDTOSchema = z.object({
  id: idSchema,
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  placeType: placeTypeSchema,
  category: listingCategorySchema,
  // location (coarse)
  division: z.string().nullable(),
  district: z.string().nullable(),
  area: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  // capacity
  maxGuests: z.number().int().positive(),
  bedrooms: z.number().int().nonnegative(),
  beds: z.number().int().nonnegative(),
  baths: z.number().int().nonnegative(),
  // pricing (BDT whole taka)
  pricePerDay: moneySchema,
  minNights: z.number().int().positive(),
  rules: z.string().nullable(),
  // relations
  images: z.array(listingImageDTOSchema),
  amenities: z.array(amenityDTOSchema),
  host: listingHostDTOSchema,
  // aggregates (computed, optional until reviews exist)
  ratingAverage: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  createdAt: isoDateTimeSchema,
});
export type ListingPublicDTO = z.infer<typeof listingPublicDTOSchema>;

/** Lightweight card shape for grids/search results. */
export const listingCardDTOSchema = listingPublicDTOSchema
  .pick({
    id: true,
    slug: true,
    title: true,
    placeType: true,
    category: true,
    division: true,
    district: true,
    area: true,
    pricePerDay: true,
    ratingAverage: true,
    reviewCount: true,
  })
  .extend({
    coverImageUrl: z.string().url().nullable(),
  });
export type ListingCardDTO = z.infer<typeof listingCardDTOSchema>;

/** Create-listing input (host). Status is server-controlled (starts `draft`). */
export const createListingInputSchema = z
  .object({
    title: z.string().trim().min(8, 'Title must be at least 8 characters').max(120),
    description: z.string().trim().max(4000).optional(),
    placeType: placeTypeSchema,
    category: listingCategorySchema,
    division: z.string().trim().min(1).max(80),
    district: z.string().trim().min(1).max(80),
    area: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(240),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    maxGuests: z.number().int().min(1).max(50),
    bedrooms: z.number().int().min(0).max(50),
    beds: z.number().int().min(0).max(100),
    baths: z.number().int().min(0).max(50),
    pricePerDay: moneySchema.refine((v) => v > 0, 'Price must be greater than 0'),
    minNights: z.number().int().min(1).max(365).default(1),
    rules: z.string().trim().max(2000).optional(),
    amenityIds: z.array(idSchema).max(100).default([]),
  })
  .strict();
export type CreateListingInput = z.infer<typeof createListingInputSchema>;

/** Edit-listing input — every field optional; status changes go through a service, not here. */
export const updateListingInputSchema = createListingInputSchema.partial();
export type UpdateListingInput = z.infer<typeof updateListingInputSchema>;
