"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/app/admin/listings/actions";
import { slugify } from "@/lib/utils";

// Clean, permanent-looking slugs ("{name}-{city}", e.g. "unity-heights-lahore")
// read far better for SEO than a random-suffixed one, and the city segment
// gives every project page a location keyword and keeps two same-named
// projects in different cities apart without needing a numeric suffix — that
// only kicks in on a genuine same-name-same-city collision, same retry
// pattern as generateUniqueAgentSlug in app/(auth)/actions.ts.
export async function generateUniqueProjectSlug(admin: SupabaseClient, name: string, citySlug: string): Promise<string> {
  const base = [slugify(name), citySlug].filter(Boolean).join("-") || "project";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data } = await admin.from("projects").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export interface ProjectUnitTypeInput {
  unit_type: string;
  total_price?: number | null;
  advance_pct?: number | null;
  advance_amount?: number | null;
  installment_yrs?: number | null;
  monthly_installment?: number | null;
  on_possession_pct?: number | null;
  on_possession_amt?: number | null;
  notes?: string | null;
}

export interface CreateProjectInput {
  developer_id: string;
  name: string;
  tagline?: string;
  type?: string;
  property_type: string;
  city_id: string;
  area_id?: string | null;
  society_id?: string | null;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  description?: string;
  amenities: string[];
  status: string;
  launch_date?: string | null;
  possession_date?: string | null;
  completion_pct?: number | null;
  total_units?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  min_area?: number | null;
  max_area?: number | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  brochure_url?: string | null;
  images: { url: string; thumb_url: string | null }[];
  unit_types: ProjectUnitTypeInput[];
}

// Admin-only, and admin-created projects publish immediately rather than
// sitting in the pending queue — the same convention app/api/listings/route.ts
// already uses for a super_admin's own listings. There's no separate
// developer submitting this for review; the admin creating it *is* the review.
export async function createProjectAction(input: CreateProjectInput) {
  const { admin } = await verifyAdmin();

  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");
  if (!input.developer_id) throw new Error("Select a developer");
  if (!input.city_id) throw new Error("Select a city");
  if (!input.property_type) throw new Error("Select a property type");

  const { data: cityRow } = await admin.from("cities").select("slug").eq("id", input.city_id).single();
  if (!cityRow) throw new Error("City not found");

  const projectId = randomUUID();
  const slug = await generateUniqueProjectSlug(admin, name, cityRow.slug);
  const coverImage = input.images[0] ?? null;

  const { error } = await admin.from("projects").insert({
    id: projectId,
    developer_id: input.developer_id,
    name,
    slug,
    tagline: input.tagline?.trim() || null,
    type: input.type?.trim() || null,
    property_type: input.property_type,
    city_id: input.city_id,
    area_id: input.area_id || null,
    society_id: input.society_id || null,
    address: input.address?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    description: input.description?.trim() || null,
    amenities: input.amenities,
    status: input.status,
    launch_date: input.launch_date || null,
    possession_date: input.possession_date || null,
    completion_pct: input.completion_pct ?? null,
    total_units: input.total_units ?? null,
    min_price: input.min_price ?? null,
    max_price: input.max_price ?? null,
    min_area: input.min_area ?? null,
    max_area: input.max_area ?? null,
    cover_image_url: coverImage?.url ?? null,
    og_image_url: coverImage?.url ?? null,
    video_url: input.video_url?.trim() || null,
    virtual_tour_url: input.virtual_tour_url?.trim() || null,
    brochure_url: input.brochure_url || null,
    status_platform: "active",
    published_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  if (input.images.length > 0) {
    await admin.from("project_images").insert(
      input.images.map((image, index) => ({
        project_id: projectId,
        url: image.url,
        thumb_url: image.thumb_url,
        type: "gallery" as const,
        display_order: index,
      })),
    );
  }

  const unitTypes = input.unit_types.filter((unit) => unit.unit_type.trim());
  if (unitTypes.length > 0) {
    await admin.from("payment_plans").insert(
      unitTypes.map((unit) => ({
        project_id: projectId,
        unit_type: unit.unit_type.trim(),
        total_price: unit.total_price ?? null,
        advance_pct: unit.advance_pct ?? null,
        advance_amount: unit.advance_amount ?? null,
        installment_yrs: unit.installment_yrs ?? null,
        monthly_installment: unit.monthly_installment ?? null,
        on_possession_pct: unit.on_possession_pct ?? null,
        on_possession_amt: unit.on_possession_amt ?? null,
        notes: unit.notes?.trim() || null,
        is_active: true,
      })),
    );
  }

  revalidatePath("/admin/projects");
  revalidatePath("/new-projects");
  revalidatePath("/");

  return { ok: true, id: projectId, slug };
}

export async function approveProjectAction(projectId: string) {
  const { admin } = await verifyAdmin();

  await admin
    .from("projects")
    .update({ status_platform: "active", published_at: new Date().toISOString() })
    .eq("id", projectId);

  revalidatePath("/admin/projects/pending");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/new-projects");
  revalidatePath("/");

  return { ok: true };
}

export async function rejectProjectAction(projectId: string, reason: string) {
  const { admin } = await verifyAdmin();

  await admin
    .from("projects")
    .update({ status_platform: "rejected", reject_reason: reason })
    .eq("id", projectId);

  revalidatePath("/admin/projects/pending");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);

  return { ok: true };
}

export async function featureProjectAction(projectId: string) {
  const { admin } = await verifyAdmin();

  await admin.from("projects").update({ is_featured: true }).eq("id", projectId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/new-projects");
  revalidatePath("/");

  return { ok: true };
}
