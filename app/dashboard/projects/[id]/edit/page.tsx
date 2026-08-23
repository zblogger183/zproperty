import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProjectForm, type ProjectFormInitialData } from "@/components/dashboard/ProjectForm";
import type { ProjectUnitTypeInput } from "@/app/admin/projects/actions";
import type { UploadedImage } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Project | ZProperty" };

interface ProjectImageRow {
  id: string;
  url: string;
  display_order: number;
}

export default async function EditDeveloperProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: projectRaw }, { data: imagesRaw }, { data: plansRaw }] = await Promise.all([
    admin
      .from("projects")
      .select(
        `id, developer_id, name, tagline, type, property_type, status, status_platform, reject_reason,
         city_id, area_id, society_id, address, lat, lng, description, amenities,
         launch_date, possession_date, completion_pct, total_units,
         min_price, max_price, min_area, max_area,
         video_url, virtual_tour_url, brochure_url`,
      )
      .eq("id", id)
      .single(),
    admin.from("project_images").select("id, url, display_order").eq("project_id", id).order("display_order"),
    admin
      .from("payment_plans")
      .select("unit_type, total_price, advance_pct, advance_amount, installment_yrs, monthly_installment, on_possession_pct, on_possession_amt, notes")
      .eq("project_id", id),
  ]);

  if (!projectRaw) notFound();
  if (projectRaw.developer_id !== user.id) redirect("/dashboard/projects");

  const images = (imagesRaw ?? []) as ProjectImageRow[];
  const uploadedImages: UploadedImage[] = images.map((image, index) => ({
    id: image.id,
    thumb_url: image.url,
    medium_url: image.url,
    large_url: image.url,
    og_url: image.url,
    alt_text: "",
    display_order: image.display_order ?? index,
    is_primary: index === 0,
  }));

  const initial: ProjectFormInitialData = {
    id: projectRaw.id,
    name: projectRaw.name,
    tagline: projectRaw.tagline,
    type: projectRaw.type,
    property_type: projectRaw.property_type ?? "flats",
    status: projectRaw.status,
    status_platform: projectRaw.status_platform,
    reject_reason: projectRaw.reject_reason,
    description: projectRaw.description,
    location: {
      city_id: projectRaw.city_id ?? undefined,
      area_id: projectRaw.area_id ?? undefined,
      society_id: projectRaw.society_id,
      address: projectRaw.address ?? undefined,
      lat: projectRaw.lat,
      lng: projectRaw.lng,
    },
    launch_date: projectRaw.launch_date,
    possession_date: projectRaw.possession_date,
    completion_pct: projectRaw.completion_pct,
    total_units: projectRaw.total_units,
    min_price: projectRaw.min_price,
    max_price: projectRaw.max_price,
    min_area: projectRaw.min_area,
    max_area: projectRaw.max_area,
    // amenities is DB-typed as jsonb — most rows hold a string[], but a
    // handful of older/directly-inserted rows hold '{}' (the column's old,
    // wrong default, see 022_fix_projects_amenities_default.sql) or null.
    // Array.isArray guards all three cases instead of trusting the shape.
    amenities: Array.isArray(projectRaw.amenities) ? (projectRaw.amenities as string[]) : [],
    images: uploadedImages,
    video_url: projectRaw.video_url,
    virtual_tour_url: projectRaw.virtual_tour_url,
    brochure_url: projectRaw.brochure_url,
    unit_types: (plansRaw ?? []) as ProjectUnitTypeInput[],
  };

  return (
    <div className="px-6 py-6">
      <Link href="/dashboard/projects" className="text-sm text-primary hover:text-primary-mid">
        ← My Projects
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">Edit Project</h1>
      <p className="mt-1 text-sm text-primary-mid">{initial.name}</p>

      <div className="mt-6">
        <ProjectForm initial={initial} />
      </div>
    </div>
  );
}
