export type ListingPurpose = "buy" | "rent";

export type ListingPropertyType =
  | "house"
  | "flat"
  | "upper_portion"
  | "lower_portion"
  | "room"
  | "residential_plot"
  | "commercial_plot"
  | "agricultural_land"
  | "office"
  | "shop"
  | "warehouse"
  | "building"
  | "other";

export type ListingStatus = "pending" | "active" | "rejected" | "paused" | "expired" | "sold";

export type FurnishedStatus = "unfurnished" | "semi_furnished" | "furnished";

// Mirrors the `listings` table in supabase/migrations/001_schema.sql.
export interface Listing {
  id: string;
  agent_id: string | null;
  agency_id: string | null;
  city_id: string | null;
  area_id: string | null;
  society_id: string | null;
  phase_id: string | null;
  block_id: string | null;
  plot_number: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  title: string;
  slug: string;
  purpose: ListingPurpose;
  type: ListingPropertyType;
  price: number;
  price_currency: string;
  is_negotiable: boolean;
  area_sqft: number | null;
  area_marla: number | null;
  area_kanal: number | null;
  beds: number | null;
  baths: number | null;
  floors: number | null;
  parking_spaces: number;
  age_years: number | null;
  furnished_status: FurnishedStatus;
  description: string | null;
  primary_image_url: string | null;
  image_count: number;
  has_video: boolean;
  status: ListingStatus;
  is_featured: boolean;
  is_hot_deal: boolean;
  is_top_search: boolean;
  views_count: number;
  calls_count: number;
  whatsapp_count: number;
  leads_count: number;
  saves_count: number;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  video_url: string | null;
  virtual_tour_url: string | null;
  features: Record<string, boolean> | null;
  og_image_url: string | null;
  meta_title: string | null;
  meta_desc: string | null;
  focus_keyword: string | null;
  robots: string;
  canonical_url: string | null;
  schema_json: Record<string, unknown> | null;
}

// Mirrors the `listing_images` table (supabase/migrations/001_schema.sql).
export interface ListingImage {
  id: string;
  thumb_url: string;
  medium_url: string;
  large_url: string;
  og_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

// The shape ImageUploader works with client-side — a superset of what
// /api/upload/image returns (it also carries `id` once known, and the
// user-editable alt_text/display_order/is_primary that only exist locally
// until a listing is saved).
export interface UploadedImage {
  id?: string;
  thumb_url: string;
  medium_url: string;
  large_url: string;
  og_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  compression_pct?: number;
  original_size_kb?: number;
}

// Mirrors the public_agent_contact view (supabase/migrations/005) — a
// public-safe projection of users+agent_profiles, since `users` RLS blocks
// anonymous reads of the base table.
export interface AgentContact {
  id: string;
  name: string;
  whatsapp: string | null;
  profile_slug: string;
  headline: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  cnic_verified: boolean;
  subscription_tier: string;
  agency_id: string | null;
}

// The joined shape returned by the homepage's featured-listings query
// (listings + cities + areas + public_agent_contact, selected via
// Supabase's embedded resource syntax) — everything ListingCard needs to
// render, nothing more. `agent_id` is kept even though the card doesn't
// display it: it's the key lib/supabase/public.ts's agent-contact fallback
// backfill needs when the embed comes back null.
export interface ListingCardData {
  id: string;
  slug: string;
  title: string;
  purpose: ListingPurpose;
  price: number;
  beds: number | null;
  baths: number | null;
  area_marla: number | null;
  primary_image_url: string | null;
  is_featured: boolean;
  is_hot_deal: boolean;
  city: { name: string } | null;
  area: { name: string } | null;
  agent_id: string | null;
  agent: Pick<AgentContact, "name" | "whatsapp" | "profile_slug"> | null;
}

// The full listing-detail shape: every `listings` column plus joined
// city/area/agent/listing_images — used by
// app/(public)/listing/[slug]/page.tsx.
export interface ListingDetailData extends Listing {
  city: { name: string; slug: string } | null;
  area: { name: string; slug: string } | null;
  society: { name: string; slug: string } | null;
  phase: { name: string } | null;
  block: { name: string } | null;
  agent: AgentContact | null;
  listing_images: ListingImage[];
}

export type ProjectStatus =
  | "pre_launch"
  | "launching"
  | "under_construction"
  | "ready"
  | "completed";

// The joined shape returned by the homepage's featured-projects query
// (projects + cities).
export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  min_price: number | null;
  max_price: number | null;
  cover_image_url: string | null;
  city: { name: string } | null;
}
