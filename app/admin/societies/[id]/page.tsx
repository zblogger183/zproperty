import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SocietyForm, type CityOption, type SocietyInitialData } from "@/components/admin/SocietyCreateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Society | ZProperty Admin" };

export default async function EditSocietyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: cities }, { data: society }] = await Promise.all([
    admin.from("cities").select("id, name").eq("is_active", true).order("name"),
    admin
      .from("societies")
      .select(
        "id, name, city_id, area_id, description, developer_name, established_yr, total_plots, total_phases, amenities, cover_image_url, gallery_images",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!society) {
    notFound();
  }

  const cityOptions: CityOption[] = (cities ?? []) as CityOption[];
  const initial: SocietyInitialData = {
    id: society.id,
    name: society.name,
    city_id: society.city_id,
    area_id: society.area_id,
    description: society.description,
    developer_name: society.developer_name,
    established_yr: society.established_yr,
    total_plots: society.total_plots,
    total_phases: society.total_phases,
    amenities: (society.amenities as string[] | null) ?? [],
    cover_image_url: society.cover_image_url,
    gallery_images: (society.gallery_images as { url: string; thumb_url: string | null }[] | null) ?? [],
  };

  return (
    <div className="px-6 py-6">
      <Link href="/admin/societies" className="text-sm text-primary hover:text-primary-mid">
        ← All Societies
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">Edit {society.name}</h1>
      <p className="mt-1 text-sm text-primary-mid">Update details, cover image, and gallery photos.</p>

      <div className="mt-6">
        <SocietyForm cities={cityOptions} initial={initial} />
      </div>
    </div>
  );
}
