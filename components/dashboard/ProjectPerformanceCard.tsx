import Link from "next/link";
import Image from "next/image";

export interface PerformanceProject {
  id: string;
  slug: string;
  name: string;
  status_platform: string;
  views_count: number;
  leads_count: number;
  min_price: number | null;
  max_price: number | null;
  cover_image_url: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-secondary text-primary",
  pending: "bg-primary text-white",
  rejected: "bg-primary-mid text-white",
};

function formatPkr(amount: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10_000_000) return `PKR ${(amount / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (amount >= 100_000) return `PKR ${(amount / 100_000).toFixed(1).replace(/\.0$/, "")} Lakh`;
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function ProjectPerformanceCard({ projects }: { projects: PerformanceProject[] }) {
  return (
    <div className="rounded-xl border border-primary bg-white">
      <div className="flex items-center justify-between border-b border-primary px-5 py-4">
        <h2 className="text-base font-bold text-black">Project Performance</h2>
        <Link href="/dashboard/projects" className="text-sm text-primary hover:text-primary-mid">
          View all →
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-primary-mid">No projects yet.</p>
          <Link href="/dashboard/projects/new" className="text-sm text-primary hover:underline">
            + Add your first project
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-primary">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3 px-5 py-3">
              <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg border border-primary">
                {project.cover_image_url ? (
                  <Image src={project.cover_image_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-mid text-xs text-white">
                    No img
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-black">
                  {project.name}{" "}
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] capitalize ${
                      STATUS_STYLES[project.status_platform] ?? "bg-primary-mid text-white"
                    }`}
                  >
                    {project.status_platform}
                  </span>
                </p>
                <p className="text-xs text-primary-mid">
                  {formatPkr(project.min_price)}
                  {project.max_price && project.max_price !== project.min_price ? ` – ${formatPkr(project.max_price)}` : ""}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-black">
                  {project.views_count.toLocaleString("en-PK")}
                  <span className="ml-1 text-[10px] font-normal text-primary-mid">views</span>
                </p>
                <p className="text-sm font-semibold text-black">
                  {project.leads_count.toLocaleString("en-PK")}
                  <span className="ml-1 text-[10px] font-normal text-primary-mid">leads</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
