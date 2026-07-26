import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { ProjectStatus } from "@/types";

// The shape returned by /new-projects's and /new-projects/city/[city]'s
// projects query — richer than the homepage's ProjectCardData (types/listing.ts),
// which only carries what the homepage teaser section needs.
export interface ProjectListCardData {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  property_type: string | null;
  status: ProjectStatus;
  min_price: number | null;
  max_price: number | null;
  total_units: number | null;
  completion_pct: number | null;
  cover_image_url: string | null;
  og_image_url: string | null;
  is_featured: boolean;
  is_verified: boolean;
  views_count: number;
  leads_count: number;
  city: { name: string; slug: string } | null;
  area: { name: string; slug: string } | null;
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  pre_launch: "bg-secondary text-primary font-bold",
  launching: "bg-secondary text-primary font-bold",
  under_construction: "bg-primary text-white",
  ready: "bg-primary-mid text-white",
  completed: "bg-primary text-secondary",
};

export function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectListCardData;
  priority?: boolean;
}) {
  const initials = project.name.trim().slice(0, 2).toUpperCase();
  const location = [project.area?.name, project.city?.name].filter(Boolean).join(", ");
  const priceLabel = project.min_price
    ? project.max_price && project.max_price !== project.min_price
      ? `${formatPrice(project.min_price, "buy")} — ${formatPrice(project.max_price, "buy")}`
      : formatPrice(project.min_price, "buy")
    : "Price on request";

  return (
    <Link
      href={`/new-projects/${project.slug}`}
      className="block cursor-pointer overflow-hidden rounded-xl border border-primary bg-white transition hover:border-2 hover:border-secondary"
    >
      <div className="relative aspect-video overflow-hidden">
        {project.cover_image_url ? (
          <Image
            src={project.cover_image_url}
            alt={project.name}
            fill
            priority={priority}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary text-xl font-bold text-white">
            {initials}
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] capitalize ${STATUS_STYLES[project.status]}`}
        >
          {project.status.replace(/_/g, " ")}
        </span>

        {project.is_verified && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-secondary">
            ✓ Verified
          </span>
        )}

        {project.status === "under_construction" && !!project.completion_pct && project.completion_pct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex h-6 flex-col justify-center gap-1 bg-primary/70 px-3">
            <span className="text-[10px] text-white">Construction: {project.completion_pct}%</span>
            <div className="h-1 w-full rounded-full bg-white/30">
              <div
                className="h-1 rounded-full bg-secondary"
                style={{ width: `${project.completion_pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold text-black">{project.name}</h3>
        {location && <p className="mt-0.5 text-xs text-primary-mid">{location}</p>}

        <div className="mt-2 flex gap-3">
          {project.property_type && (
            <span className="rounded-full border border-primary bg-white px-2 py-0.5 text-[10px] capitalize text-primary">
              {project.property_type}
            </span>
          )}
          {!!project.total_units && (
            <span className="text-xs text-primary-mid">{project.total_units} units</span>
          )}
        </div>

        <p className="mt-2 text-lg font-bold text-black">
          {project.min_price ? priceLabel : <span className="text-sm text-primary-mid">{priceLabel}</span>}
        </p>

        <span className="mt-3 block w-full rounded-lg bg-secondary py-2 text-center text-xs font-bold text-primary hover:bg-secondary-dark">
          View Details
        </span>
      </div>
    </Link>
  );
}
