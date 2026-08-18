import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createListingSchema } from "@/app/dashboard/listings/schemas";
import { approveListingAction } from "@/app/admin/listings/actions";
import { sanitizeRichText } from "@/lib/utils/sanitizeHtml";

const ALLOWED_ROLES = new Set(["agent", "developer", "super_admin", "admin"]);
const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 50, elite: 999999 };

function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base}-${id.slice(0, 8)}`;
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify user is agent/developer/admin
  const { data: userRow } = await admin
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!userRow?.is_active || !ALLOWED_ROLES.has(userRow.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawBody = await request.json();

  // Validate the full payload server-side rather than trusting whatever a
  // client sends — the wizard UI validates each step, but a direct API call
  // bypasses that entirely, and the given version of this route inserted
  // `body.*` fields straight into the DB with no such check.
  const parsed = createListingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid listing data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  // super_admin lists on the platform's own behalf, not as a plan-limited
  // tenant — no quota check, and (below) their listing skips the pending
  // review queue entirely instead of waiting on themselves to approve it.
  const isSuperAdmin = userRow.role === "super_admin";

  // Get agent_profile for subscription check
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("id, subscription_tier, active_listings, total_listings")
    .eq("user_id", user.id)
    .single();

  // Check listing limits based on plan
  if (profile && !isSuperAdmin) {
    const limit = PLAN_LIMITS[profile.subscription_tier ?? "free"];
    if ((profile.active_listings ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `Your ${profile.subscription_tier} plan allows ${limit} active listings. Please upgrade.`,
        },
        { status: 403 },
      );
    }
  }

  // Generate listing ID and slug
  const listingId = randomUUID();
  const slug = generateSlug(body.title, listingId);

  // Build listing row
  const listing = {
    id: listingId,
    agent_id: user.id,
    city_id: body.city_id,
    area_id: body.area_id,
    society_id: body.society_id || null,
    phase_id: body.phase_id || null,
    block_id: body.block_id || null,
    plot_number: body.plot_number || null,
    address: body.address || null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    title: body.title,
    slug,
    purpose: body.purpose,
    type: body.type,
    price: body.price,
    is_negotiable: body.is_negotiable ?? false,
    area_sqft: body.area_sqft ?? null,
    area_marla: body.area_marla ?? null,
    beds: body.beds ?? null,
    baths: body.baths ?? null,
    floors: body.floors ?? null,
    floor_number: body.floor_number ?? null,
    parking_spaces: body.parking_spaces ?? 0,
    age_years: body.age_years ?? null,
    furnished_status: body.furnished_status ?? "unfurnished",
    // Sanitized here (write time), not just at render time, so the stored
    // data is never live markup regardless of which page later renders it.
    description: sanitizeRichText(body.description),
    features: body.features ?? {},
    video_url: body.video_url || null,
    contact_phone: body.contact_phone || null,
    contact_whatsapp: body.contact_whatsapp || null,
    has_video: !!body.video_url,
    status: "pending", // always pending until admin approves
    meta_title: body.meta_title || null,
    meta_desc: body.meta_desc || null,
    focus_keyword: body.focus_keyword || null,
    image_count: body.images?.length ?? 0,
    primary_image_url: body.images?.[0]?.large_url ?? null,
    og_image_url: body.images?.[0]?.og_url ?? null,
  };

  const { data: created, error } = await admin.from("listings").insert(listing).select("id, slug").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert listing_images
  if (body.images.length > 0) {
    await admin.from("listing_images").insert(
      body.images.map((image, index) => ({
        listing_id: created.id,
        thumb_url: image.thumb_url,
        medium_url: image.medium_url,
        large_url: image.large_url,
        og_url: image.og_url,
        alt_text: image.alt_text || null,
        display_order: index,
        is_primary: index === 0,
      })),
    );
  }

  // Increment the agent's listing counts. Fixed from the given version,
  // which incremented `total_listings` but only ever checked
  // `active_listings` against the plan limit above — meaning that limit
  // could never actually trigger, since the field it compared against never
  // changed. Both counters increment here so the check stays meaningful.
  // Skipped for super_admin: approveListingAction below increments
  // active_listings itself on approval, and incrementing both here and
  // there would double-count for the one path where both run.
  if (profile && !isSuperAdmin) {
    await admin
      .from("agent_profiles")
      .update({
        total_listings: (profile.total_listings ?? 0) + 1,
        active_listings: (profile.active_listings ?? 0) + 1,
      })
      .eq("user_id", user.id);
  }

  // super_admin's own listings publish immediately rather than sitting in
  // the pending queue — reuses the same admin-approval path (schema_json
  // generation, notifications, active_listings bump) a real admin approval
  // would run, instead of duplicating that logic here.
  if (isSuperAdmin) {
    await approveListingAction(created.id);
  }

  return NextResponse.json({ id: created.id, slug: created.slug });
}
