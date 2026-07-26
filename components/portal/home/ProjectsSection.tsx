import Link from "next/link";
import type { ProjectCardData } from "@/types";
import { ProjectCard } from "../ProjectCard";

export function ProjectsSection({ projects }: { projects: ProjectCardData[] }) {
  return (
    <section className="border-t border-primary bg-white px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-black">New Projects</h2>
          <Link href="/new-projects" className="text-sm text-primary transition hover:text-primary-mid">
            View all →
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="mt-8 text-sm text-primary-mid">New projects will appear here soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
