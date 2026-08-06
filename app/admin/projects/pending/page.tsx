import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PendingProjectsClient, type PendingProject } from "@/components/admin/PendingProjectsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pending Projects | SarZameenz Admin" };

export default async function PendingProjectsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("projects")
    .select(
      `id, name, slug, tagline, property_type, min_price, max_price, total_units,
       cover_image_url, created_at,
       city:cities(name), area:areas(name),
       developer:users!projects_developer_id_fkey(name, email)`,
    )
    .eq("status_platform", "pending")
    .order("created_at", { ascending: true });

  const projects = (data ?? []) as unknown as PendingProject[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Pending Projects</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
          {projects.length} awaiting review
        </span>
      </div>

      <PendingProjectsClient initialProjects={projects} />
    </div>
  );
}
