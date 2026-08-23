"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueProjectSlug, type ProjectUnitTypeInput } from "@/app/admin/projects/actions";

// Mirrors verifyAdmin() in app/admin/listings/actions.ts, scoped to the
// developer role instead — every action below writes through the admin
// (service_role) client, so this ownership check is the only thing standing
// between one developer and another developer's project.
export async function verifyDeveloper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();

  if (!data || data.role !== "developer") {
    throw new Error("Forbidden");
  }

  return { user, admin };
}

export interface DeveloperProjectInput {
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

// Developer-submitted projects go into the same status_platform: "pending"
// queue as everything else on /admin/projects/pending (app/api/listings/
// route.ts uses the identical pattern for agent listings) — the developer
// isn't the reviewer here, unlike an admin creating a project directly via
// app/admin/projects/actions.ts, which publishes immediately.
export async function createDeveloperProjectAction(input: DeveloperProjectInput) {
  const { user, admin } = await verifyDeveloper();

  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");
  if (!input.city_id) throw new Error("Select a city");
  if (!input.property_type) throw new Error("Select a property type");

  const { data: cityRow } = await admin.from("cities").select("slug").eq("id", input.city_id).single();
  if (!cityRow) throw new Error("City not found");

  const projectId = randomUUID();
  const slug = await generateUniqueProjectSlug(admin, name, cityRow.slug);
  const coverImage = input.images[0] ?? null;

  const { error } = await admin.from("projects").insert({
    id: projectId,
    developer_id: user.id,
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
    status_platform: "pending",
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

  revalidatePath("/dashboard/projects");
  revalidatePath("/admin/projects/pending");

  return { ok: true, id: projectId, slug };
}

export async function updateDeveloperProjectAction(projectId: string, input: DeveloperProjectInput) {
  const { user, admin } = await verifyDeveloper();

  const { data: existing } = await admin
    .from("projects")
    .select("developer_id, status_platform, slug")
    .eq("id", projectId)
    .single();

  if (!existing || existing.developer_id !== user.id) throw new Error("Forbidden");

  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");
  if (!input.city_id) throw new Error("Select a city");
  if (!input.property_type) throw new Error("Select a property type");

  const coverImage = input.images[0] ?? null;
  // A rejected project goes back into the review queue on resubmission —
  // any other status (pending/active) is left alone so a minor edit to a
  // already-published project doesn't knock it offline.
  const wasRejected = existing.status_platform === "rejected";

  const { error } = await admin
    .from("projects")
    .update({
      name,
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
      ...(wasRejected ? { status_platform: "pending", reject_reason: null } : {}),
    })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  await admin.from("project_images").delete().eq("project_id", projectId);
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

  await admin.from("payment_plans").delete().eq("project_id", projectId);
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

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  revalidatePath("/admin/projects/pending");
  if (!wasRejected) {
    revalidatePath(`/new-projects/${existing.slug}`);
    revalidatePath("/new-projects");
  }

  return { ok: true, id: projectId };
}
