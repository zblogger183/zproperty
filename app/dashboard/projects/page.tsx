import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DismissableBanner } from "@/components/dashboard/DismissableBanner";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["all", "pending", "active", "rejected"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary font-bold",
  pending: "bg-primary text-white",
  rejected: "border border-primary bg-white text-black",
};

interface DeveloperProjectRow {
  id: string;
  name: string;
  slug: string;
  status_platform: string;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  cover_image_url: string | null;
  views_count: number;
  leads_count: number;
  created_at: string;
  city: { name: string } | null;
}

function formatPkr(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10_000_000) return `PKR ${(amount / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (amount >= 100_000) return `PKR ${(amount / 100_000).toFixed(1).replace(/\.0$/, "")} Lakh`;
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default async function DeveloperProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; submitted?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const status: StatusFilter = STATUS_TABS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  let query = admin
    .from("projects")
    .select(
      `id, name, slug, status_platform, property_type, min_price, max_price,
       cover_image_url, views_count, leads_count, created_at, city:cities(name)`,
    )
    .eq("developer_id", user.id)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status_platform", status);
  }

  const [{ data }, { data: allStatuses }] = await Promise.all([
    query,
    admin.from("projects").select("status_platform").eq("developer_id", user.id),
  ]);

  const projects = (data ?? []) as unknown as DeveloperProjectRow[];
  const statusCounts = {
    all: allStatuses?.length ?? 0,
    pending: allStatuses?.filter((p) => p.status_platform === "pending").length ?? 0,
    active: allStatuses?.filter((p) => p.status_platform === "active").length ?? 0,
    rejected: allStatuses?.filter((p) => p.status_platform === "rejected").length ?? 0,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <Suspense fallback={null}>
        <DismissableBanner
          param="submitted"
          value="true"
          storageKey="project-submitted-banner"
          message="✓ Your project has been submitted for review. We'll notify you once it goes live (usually within 24 hours)."
        />
        <DismissableBanner
          param="updated"
          value="true"
          storageKey="project-updated-banner"
          message="✓ Project updated."
        />
      </Suspense>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">My Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + Add Project
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/dashboard/projects" : `/dashboard/projects?status=${tab}`}
            className={`rounded-lg px-4 py-2 text-sm capitalize ${
              status === tab ? "bg-secondary font-bold text-primary" : "border border-primary bg-white text-primary"
            }`}
          >
            {tab} ({statusCounts[tab]})
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        {projects.length === 0 && status === "all" ? (
          <div className="py-20 text-center">
            <p className="text-base font-semibold text-black">You haven&apos;t added any projects yet.</p>
            <p className="mt-2 text-sm text-primary-mid">Add your first project to start getting enquiries.</p>
            <Link
              href="/dashboard/projects/new"
              className="mt-4 inline-block rounded-lg bg-secondary px-6 py-3 text-sm font-bold text-primary hover:bg-secondary-dark"
            >
              + Add Your First Project
            </Link>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center text-primary-mid">
            <p>No {status} projects.</p>
            <Link href="/dashboard/projects" className="text-primary underline">
              View all projects
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary text-xs text-white">
              <tr>
                <th className="w-16 px-4 py-3 text-left font-semibold">Image</th>
                <th className="px-4 py-3 text-left font-semibold">Name + City</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Performance</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
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
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-sm font-medium text-black">{project.name}</p>
                    <p className="truncate text-xs text-primary-mid">{project.city?.name ?? "—"}</p>
                  </td>
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
                    {project.views_count.toLocaleString("en-PK")} views · {project.leads_count.toLocaleString("en-PK")} leads
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-mid">
                    {formatPkr(project.min_price)}
                    {project.max_price && project.max_price !== project.min_price ? ` – ${formatPkr(project.max_price)}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/projects/${project.id}/edit`} className="text-xs text-primary underline">
                        Edit
                      </Link>
                      {project.status_platform === "active" && (
                        <Link href={`/new-projects/${project.slug}`} target="_blank" className="text-xs text-primary underline">
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
