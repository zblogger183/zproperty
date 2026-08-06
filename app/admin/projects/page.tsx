import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "All Projects | SarZameenz Admin" };

const STATUS_TABS = ["all", "pending", "active", "rejected"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary",
  pending: "bg-primary text-white",
  rejected: "border border-primary bg-white text-black",
};

interface AdminProjectRow {
  id: string;
  name: string;
  slug: string;
  status_platform: string;
  status: string;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  cover_image_url: string | null;
  created_at: string;
  city: { name: string } | null;
  developer: { name: string } | null;
}

export default async function AllProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status: StatusFilter = STATUS_TABS.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : "all";

  const admin = createAdminClient();

  let query = admin
    .from("projects")
    .select(
      `id, name, slug, status_platform, status, property_type, min_price, max_price,
       cover_image_url, created_at,
       city:cities(name),
       developer:users!projects_developer_id_fkey(name)`,
      { count: "exact" },
    );

  if (status !== "all") {
    query = query.eq("status_platform", status);
  }

  const { data, count } = await query.order("created_at", { ascending: false }).limit(100);
  const projects = (data ?? []) as unknown as AdminProjectRow[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">All Projects</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {count ?? 0} total
        </span>
      </div>

      <div className="mb-6 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-white p-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/projects" : `/admin/projects?status=${tab}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              status === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Image</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Developer</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3">
                  {project.cover_image_url ? (
                    <div className="relative h-9 w-12 overflow-hidden rounded border border-primary">
                      <Image src={project.cover_image_url} alt="" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-9 w-12 rounded bg-primary-mid" />
                  )}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-sm font-medium text-black">
                  <Link href={`/admin/projects/${project.id}`} className="hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{project.developer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">{project.city?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      STATUS_BADGE_CLASSES[project.status_platform] ?? ""
                    }`}
                  >
                    {project.status_platform}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  {project.status_platform === "active" && (
                    <Link href={`/new-projects/${project.slug}`} target="_blank" className="text-xs text-primary underline">
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {projects.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No projects match these filters.</p>
        )}
      </div>
    </div>
  );
}
