"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/app/admin/listings/actions";
import { slugify } from "@/lib/utils";

// Societies are unique per (city_id, slug) at the DB level, not globally —
// same retry pattern as generateUniqueProjectSlug/generateUniqueAgentSlug.
async function generateUniqueSocietySlug(admin: SupabaseClient, name: string, cityId: string): Promise<string> {
  const base = slugify(name) || "society";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data } = await admin
      .from("societies")
      .select("id")
      .eq("slug", candidate)
      .eq("city_id", cityId)
      .maybeSingle();
    if (!data) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export interface SocietyImageInput {
  url: string;
  thumb_url: string | null;
}

export interface CreateSocietyInput {
  name: string;
  city_id: string;
  area_id?: string | null;
  description?: string;
  developer_name?: string;
  established_yr?: number | null;
  total_plots?: number | null;
  total_phases?: number | null;
  amenities: string[];
  cover_image_url?: string | null;
  gallery_images?: SocietyImageInput[];
}

export async function createSocietyAction(input: CreateSocietyInput) {
  const { admin } = await verifyAdmin();

  const name = input.name.trim();
  if (!name) throw new Error("Society name is required");
  if (!input.city_id) throw new Error("Select a city");

  const slug = await generateUniqueSocietySlug(admin, name, input.city_id);

  const { data, error } = await admin
    .from("societies")
    .insert({
      id: randomUUID(),
      city_id: input.city_id,
      area_id: input.area_id || null,
      name,
      slug,
      description: input.description?.trim() || null,
      developer_name: input.developer_name?.trim() || null,
      established_yr: input.established_yr ?? null,
      total_plots: input.total_plots ?? null,
      total_phases: input.total_phases ?? null,
      amenities: input.amenities,
      cover_image_url: input.cover_image_url || null,
      gallery_images: input.gallery_images ?? [],
      is_active: true,
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/societies");

  return { ok: true, id: data.id as string, slug: data.slug as string };
}

export interface UpdateSocietyInput extends CreateSocietyInput {
  id: string;
}

export async function updateSocietyAction(input: UpdateSocietyInput) {
  const { admin } = await verifyAdmin();

  const name = input.name.trim();
  if (!name) throw new Error("Society name is required");
  if (!input.city_id) throw new Error("Select a city");

  const { error } = await admin
    .from("societies")
    .update({
      city_id: input.city_id,
      area_id: input.area_id || null,
      name,
      description: input.description?.trim() || null,
      developer_name: input.developer_name?.trim() || null,
      established_yr: input.established_yr ?? null,
      total_plots: input.total_plots ?? null,
      total_phases: input.total_phases ?? null,
      amenities: input.amenities,
      cover_image_url: input.cover_image_url || null,
      gallery_images: input.gallery_images ?? [],
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/societies");
  revalidatePath(`/admin/societies/${input.id}`);

  return { ok: true, id: input.id };
}
