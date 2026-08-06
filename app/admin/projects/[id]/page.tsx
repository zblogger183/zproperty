import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProjectStatusActions } from "@/components/admin/ProjectStatusActions";
import { FeatureProjectButton } from "@/components/admin/FeatureProjectButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Project Detail | SarZameenz Admin" };

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary font-bold",
  pending: "bg-primary text-white",
  rejected: "border border-primary bg-white text-black",
};

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  type: string | null;
  property_type: string | null;
  status: string;
  status_platform: string;
  address: string | null;
  description: string | null;
  amenities: string[] | null;
  launch_date: string | null;
  possession_date: string | null;
  completion_pct: number | null;
  total_units: number | null;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  is_featured: boolean;
  views_count: number;
  leads_count: number;
  reject_reason: string | null;
  created_at: string;
  published_at: string | null;
  cities: { name: string } | null;
  areas: { name: string } | null;
  developer: { id: string; name: string; email: string | null; phone: string | null } | null;
}

interface ProjectImageRow {
  id: string;
  url: string;
  type: string | null;
  display_order: number;
}

function formatPkr(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10_000_000) return `PKR ${(amount / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (amount >= 100_000) return `PKR ${(amount / 100_000).toFixed(1).replace(/\.0$/, "")} Lakh`;
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: projectRaw }, { data: imagesRaw }] = await Promise.all([
    admin
      .from("projects")
      .select(
        `id, name, slug, tagline, type, property_type, status, status_platform,
         address, description, amenities, launch_date, possession_date, completion_pct,
         total_units, min_price, max_price, min_area, max_area,
         is_featured, views_count, leads_count, reject_reason, created_at, published_at,
         cities(name), areas(name),
         developer:users!projects_developer_id_fkey(id, name, email, phone)`,
      )
      .eq("id", id)
      .single(),
    admin.from("project_images").select("id, url, type, display_order").eq("project_id", id).order("display_order"),
  ]);

  if (!projectRaw) notFound();

  const project = projectRaw as unknown as ProjectDetail;
  const images = (imagesRaw ?? []) as ProjectImageRow[];
  const location = [project.areas?.name, project.cities?.name].filter(Boolean).join(", ");
  const priceRange = `${formatPkr(project.min_price)}${
    project.max_price && project.max_price !== project.min_price ? ` – ${formatPkr(project.max_price)}` : ""
  }`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <nav className="text-sm text-primary-mid">
        <Link href="/admin" className="hover:text-primary hover:underline">
          Admin
        </Link>
        {" > "}
        <Link href="/admin/projects" className="hover:text-primary hover:underline">
          All Projects
        </Link>
        {" > "}
        <span className="text-black">{project.name.length > 40 ? `${project.name.slice(0, 40)}…` : project.name}</span>
      </nav>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{project.name}</h1>
          {location && <p className="mt-1 text-sm text-primary-mid">{location}</p>}
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs capitalize ${
              STATUS_BADGE_CLASSES[project.status_platform] ?? ""
            }`}
          >
            {project.status_platform}
          </span>
        </div>

        <div className="flex flex-col items-end gap-3">
          <ProjectStatusActions projectId={project.id} status={project.status_platform} />
          <Link href="/admin/projects" className="text-sm text-primary underline">
            ← Back to Projects
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-black">Photos ({images.length})</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-video overflow-hidden rounded-xl border border-primary"
                  >
                    <Image src={image.url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-primary-mid">No photos uploaded</p>
            )}
          </div>

          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-black">Project Details</h2>
            <dl className="grid grid-cols-2 gap-x-6">
              <DetailRow label="Property Type" value={project.property_type ?? "—"} />
              <DetailRow label="Construction Status" value={(project.status ?? "—").replace(/_/g, " ")} />
              <DetailRow label="Price Range" value={priceRange} />
              <DetailRow label="Total Units" value={project.total_units ?? "—"} />
              <DetailRow
                label="Area Range"
                value={
                  project.min_area != null
                    ? `${project.min_area}${project.max_area ? ` – ${project.max_area}` : ""} sqft`
                    : "—"
                }
              />
              <DetailRow label="Completion" value={project.completion_pct != null ? `${project.completion_pct}%` : "—"} />
              <DetailRow
                label="Launch Date"
                value={project.launch_date ? format(new Date(project.launch_date), "MMM d, yyyy") : "—"}
              />
              <DetailRow
                label="Possession"
                value={project.possession_date ? format(new Date(project.possession_date), "MMM d, yyyy") : "—"}
              />
              <DetailRow label="Views" value={project.views_count} />
              <DetailRow label="Leads" value={project.leads_count} />
              <DetailRow label="Submitted" value={format(new Date(project.created_at), "MMM d, yyyy")} />
              <DetailRow
                label="Published"
                value={project.published_at ? format(new Date(project.published_at), "MMM d, yyyy") : "—"}
              />
            </dl>
          </div>

          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-black">Description</h2>
            {project.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-black">{project.description}</p>
            ) : (
              <p className="text-sm italic text-primary-mid">No description</p>
            )}

            {project.amenities && project.amenities.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-bold text-black">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-primary-mid px-2.5 py-1 text-xs capitalize text-white"
                    >
                      {amenity.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {project.status_platform === "rejected" && project.reject_reason && (
            <div className="rounded-xl border-l-4 border-primary bg-white p-4">
              <p className="text-sm font-semibold text-black">Rejection Reason:</p>
              <p className="mt-1 text-sm text-primary-mid">{project.reject_reason}</p>
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <p className="mb-3 text-xs uppercase text-primary-mid">Developer</p>
            {project.developer ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-secondary">
                  {project.developer.name.charAt(0).toUpperCase()}
                </div>
                <p className="mt-2 text-base font-bold text-black">{project.developer.name}</p>
                <p className="text-xs text-primary-mid">{project.developer.email ?? "—"}</p>
                <p className="text-xs text-primary-mid">{project.developer.phone ?? "—"}</p>
              </>
            ) : (
              <p className="text-sm text-primary-mid">No developer assigned</p>
            )}
          </div>

          <div className="rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-black">Quick Actions</h2>
            <div className="space-y-2">
              <FeatureProjectButton projectId={project.id} isFeatured={project.is_featured} />
              {project.status_platform === "active" && (
                <Link
                  href={`/new-projects/${project.slug}`}
                  target="_blank"
                  className="block w-full rounded-lg border border-primary bg-white py-2 text-center text-sm text-primary"
                >
                  View live project
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-primary py-2 last:border-b-0">
      <dt className="text-xs uppercase tracking-wide text-primary-mid">{label}</dt>
      <dd className="text-sm font-semibold capitalize text-black">{value}</dd>
    </div>
  );
}
