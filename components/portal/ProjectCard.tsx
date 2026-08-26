import Image from "next/image";
import Link from "next/link";
import type { ProjectCardData, ProjectStatus } from "@/types";
import { formatPkrPrice } from "@/lib/utils";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  pre_launch: "Pre-launch",
  launching: "Pre-launch",
  under_construction: "Under Construction",
  ready: "Ready",
  completed: "Ready",
};

const BLUR_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='9'><rect width='16' height='9' fill='#1C4B42'/></svg>";
const BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(BLUR_SVG).toString("base64")}`;

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const priceRange =
    project.min_price != null && project.max_price != null
      ? `From ${formatPkrPrice(project.min_price)} to ${formatPkrPrice(project.max_price)}`
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-primary bg-white">
      <Link href={`/new-projects/${project.slug}`} className="block">
        <div className="relative aspect-video bg-primary/10">
          {project.cover_image_url ? (
            <Image
              src={project.cover_image_url}
              alt={project.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              quality={65}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-primary-mid">
              No image
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-primary-mid px-2 py-1 text-xs text-white">
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        <div className="p-4">
          <h3 className="text-base font-bold text-black">{project.name}</h3>
          {project.city?.name && <p className="text-sm text-primary-mid">{project.city.name}</p>}
          {priceRange && <p className="mt-1 font-semibold text-black">{priceRange}</p>}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Link
          href={`/new-projects/${project.slug}`}
          className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary transition hover:bg-secondary-dark"
        >
          Get Details
        </Link>
      </div>
    </div>
  );
}
