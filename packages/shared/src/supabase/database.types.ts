/**
 * database.types.ts — the supabase-js `Database` generic, derived from the internal
 * row types in ../types/database.ts.
 *
 * This is what makes `createClient<Database>()` fully typed. It is the ONLY place
 * the two worlds meet: it shapes Row/Insert/Update per table from our hand-written
 * row types so repositories get end-to-end type safety without us maintaining a
 * second copy of every column by hand. Insert/Update treat server-defaulted
 * columns (id, timestamps) as optional.
 */
import type {
  AvailabilityBlock,
  Amenity,
  BlogPost,
  Booking,
  BookingStatusHistory,
  Collection,
  Conversation,
  Listing,
  ListingAmenity,
  ListingCollection,
  ListingImage,
  Message,
  Notification,
  Payment,
  Profile,
  Review,
} from '../types/database.js';

/** Columns the DB fills in by default → optional on Insert. */
type ServerDefaulted = 'id' | 'created_at' | 'updated_at';

type InsertOf<Row> = Omit<Row, Extract<keyof Row, ServerDefaulted>> &
  Partial<Pick<Row, Extract<keyof Row, ServerDefaulted>>>;

type UpdateOf<Row> = Partial<Row>;

/** Helper to assemble a PostgREST table definition from a Row type. */
interface TableDef<Row> {
  Row: Row;
  Insert: InsertOf<Row>;
  Update: UpdateOf<Row>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      listings: TableDef<Listing>;
      listing_images: TableDef<ListingImage>;
      amenities: TableDef<Amenity>;
      listing_amenities: TableDef<ListingAmenity>;
      collections: TableDef<Collection>;
      listing_collections: TableDef<ListingCollection>;
      availability_blocks: TableDef<AvailabilityBlock>;
      bookings: TableDef<Booking>;
      booking_status_history: TableDef<BookingStatusHistory>;
      conversations: TableDef<Conversation>;
      messages: TableDef<Message>;
      reviews: TableDef<Review>;
      payments: TableDef<Payment>;
      notifications: TableDef<Notification>;
      blog_posts: TableDef<BlogPost>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'guest' | 'host' | 'admin';
      place_type: 'entire' | 'private' | 'shared';
      listing_category: 'apartment' | 'room' | 'hotel' | 'resort' | 'villa' | 'studio';
      listing_status: 'draft' | 'pending' | 'published' | 'suspended';
      booking_status:
        | 'requested'
        | 'approved'
        | 'payment_pending'
        | 'confirmed'
        | 'completed'
        | 'declined'
        | 'cancelled';
      payment_status: 'initiated' | 'success' | 'failed' | 'refunded';
      availability_reason: 'booked' | 'manual';
      content_status: 'draft' | 'published';
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience aliases for repository code. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
