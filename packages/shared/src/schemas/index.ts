/**
 * schemas/index.ts — barrel for all zod schemas + inferred DTO/input types.
 * These ARE the public client shapes. Services validate with the input schemas
 * and return the DTO shapes; clients import the inferred types.
 */

// common
export {
  idSchema,
  isoDateTimeSchema,
  dateStringSchema,
  moneySchema,
  paginationSchema,
  paginatedSchema,
  CURRENCY,
} from './common.schema.js';
export type { Money, Currency, Pagination, Paginated } from './common.schema.js';

// auth
export {
  emailSchema,
  passwordSchema,
  signupInputSchema,
  loginInputSchema,
  authUserDTOSchema,
} from './auth.schema.js';
export type { SignupInput, LoginInput, AuthUserDTO } from './auth.schema.js';

// listing
export {
  placeTypeSchema,
  listingCategorySchema,
  listingStatusSchema,
  listingImageDTOSchema,
  amenityDTOSchema,
  listingHostDTOSchema,
  listingPublicDTOSchema,
  listingCardDTOSchema,
  createListingInputSchema,
  updateListingInputSchema,
} from './listing.schema.js';
export type {
  ListingImageDTO,
  AmenityDTO,
  ListingHostDTO,
  ListingPublicDTO,
  ListingCardDTO,
  CreateListingInput,
  UpdateListingInput,
} from './listing.schema.js';

// search
export {
  dateRangeSchema,
  searchSortSchema,
  searchParamsSchema,
} from './search.schema.js';
export type { DateRange, SearchSort, SearchParams } from './search.schema.js';

// booking (incl. state machine)
export {
  bookingStatusSchema,
  BOOKING_STATUSES,
  TERMINAL_BOOKING_STATUSES,
  BOOKING_TRANSITIONS,
  canTransition,
  transitionFor,
  isTerminalStatus,
  createBookingInputSchema,
  bookingTransitionInputSchema,
  priceBreakdownSchema,
  bookingListingSummarySchema,
  bookingDTOSchema,
} from './booking.schema.js';
export type {
  BookingStatusValue,
  BookingAction,
  BookingTransition,
  CreateBookingInput,
  BookingTransitionInput,
  PriceBreakdown,
  BookingDTO,
} from './booking.schema.js';

// review
export {
  ratingSchema,
  createReviewInputSchema,
  reviewAuthorDTOSchema,
  reviewDTOSchema,
  ratingAggregateSchema,
} from './review.schema.js';
export type {
  CreateReviewInput,
  ReviewAuthorDTO,
  ReviewDTO,
  RatingAggregate,
} from './review.schema.js';
