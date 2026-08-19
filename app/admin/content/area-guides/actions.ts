"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface AreaGuideInput {
  overview: string;
  pros: string[];
  cons: string[];
  review_summary: string;
  meta_title: string;
  meta_desc: string;
  is_published: boolean;
  map_pdf_url: string;
}

export async function saveAreaGuideAction(societyId: string, input: AreaGuideInput) {
  const { admin } = await verifyAdmin();

  const { data: society } = await admin.from("societies").select("id, slug, area:areas(slug, city:cities(slug))").eq("id", societyId).single();
  if (!society) throw new Error("Society not found");

  const { error } = await admin.from("area_guides").upsert(
    {
      society_id: societyId,
      overview: input.overview,
      pros: input.pros,
      cons: input.cons,
      review_summary: input.review_summary,
      meta_title: input.meta_title,
      meta_desc: input.meta_desc,
      is_published: input.is_published,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "society_id" },
  );

  if (error) throw new Error(error.message);

  // map_pdf_url lives on societies, not area_guides — it's a fact about the
  // society itself (shown regardless of guide publish status), not editorial
  // guide content.
  const { error: mapError } = await admin
    .from("societies")
    .update({ map_pdf_url: input.map_pdf_url || null })
    .eq("id", societyId);

  if (mapError) throw new Error(mapError.message);

  revalidatePath("/admin/content/area-guides");
  revalidatePath(`/admin/content/area-guides/${societyId}`);

  const area = society.area as unknown as { slug: string; city: { slug: string } | null } | null;
  if (area?.city?.slug) {
    revalidatePath(`/area-guide/${area.city.slug}/${society.slug}`);
  }

  return { ok: true };
}

export async function deleteAreaGuideAction(societyId: string) {
  const { admin } = await verifyAdmin();

  await admin.from("area_guides").delete().eq("society_id", societyId);

  revalidatePath("/admin/content/area-guides");

  return { ok: true };
}
