import { Suspense } from "react";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { ProjectCard, type ProjectListCardData } from "@/components/portal/projects/ProjectCard";
import { ProjectsFilterBar } from "@/components/portal/projects/ProjectsFilterBar";
import { ProjectsLinksSidebar } from "@/components/portal/projects/ProjectsLinksSidebar";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "New Property Projects in Pakistan — Off-Plan & Ready | ZProperty",
  description:
    "Browse new residential and commercial projects in Lahore, Karachi and Islamabad. Pre-launch prices, payment plans, and developer contact.",
};

const PROJECT_COLUMNS =
  "id, slug, name, tagline, property_type, status, min_price, max_price, total_units, completion_pct, cover_image_url, og_image_url, is_featured, is_verified, views_count, leads_count, city:cities(name, slug), area:areas(name, slug)";

export default async function NewProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; property_type?: string; status?: string }>;
}) {
  const { city: cityFilter, property_type: typeFilter, status: statusFilter } = await searchParams;
  const supabase = createPublicClient();

  const [{ data: projectsRaw }, { data: cities }] = await Promise.all([
    supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("status_platform", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("cities").select("id, name, slug").eq("is_active", true).order("display_order"),
  ]);

  let projects = (projectsRaw ?? []) as unknown as ProjectListCardData[];

  if (cityFilter) {
    projects = projects.filter((project) => project.city?.slug === cityFilter);
  }
  if (typeFilter) {
    projects = projects.filter((project) => project.property_type === typeFilter);
  }
  if (statusFilter) {
    projects = projects.filter((project) => project.status === statusFilter);
  }

  const featured = projects.filter((project) => project.is_featured);
  const rest = projects.filter((project) => !project.is_featured);

  return (
    <>
      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">New Projects</h1>
        <p className="mt-2 text-base text-white/70">Off-plan and ready-to-move properties across Pakistan</p>
        <p className="mt-3 text-sm font-bold text-secondary">{projects.length} active projects</p>
      </div>

      <div className="sticky top-14 z-30">
        <Suspense fallback={<div className="h-[57px] border-b border-primary bg-white" />}>
          <ProjectsFilterBar cities={cities ?? []} />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        {projects.length === 0 ? (
          <div className="py-20 text-center text-primary-mid">No projects listed yet.</div>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-1">
              {featured.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-bold text-black">Featured Projects</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {featured.map((project, index) => (
                      <ProjectCard key={project.id} project={project} priority={index === 0} />
                    ))}
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <h2 className="mb-4 text-xl font-bold text-black">
                  {rest.length} {featured.length > 0 ? "More " : ""}
                  {rest.length === 1 ? "Project" : "Projects"}
                </h2>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {rest.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>

            <div className="md:w-64 md:shrink-0">
              <ProjectsLinksSidebar cities={cities ?? []} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
