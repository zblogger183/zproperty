import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ProjectCard, type ProjectListCardData } from "@/components/portal/projects/ProjectCard";
import { ProjectsFilterBar } from "@/components/portal/projects/ProjectsFilterBar";
import { ProjectsLinksSidebar } from "@/components/portal/projects/ProjectsLinksSidebar";

export const revalidate = 3600;

const PROJECT_COLUMNS =
  "id, slug, name, tagline, property_type, status, min_price, max_price, total_units, completion_pct, cover_image_url, og_image_url, is_featured, is_verified, views_count, leads_count, city:cities(name, slug), area:areas(name, slug)";

async function getCity(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("cities").select("id, name, slug").eq("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCity(citySlug);

  if (!city) {
    return { title: "City not found | ZProperty.pk" };
  }

  return {
    title: `New Projects in ${city.name} — Off-Plan & Ready | ZProperty`,
    description: `Browse new residential and commercial projects in ${city.name}. Pre-launch prices, payment plans, and developer contact.`,
  };
}

export default async function NewProjectsCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ property_type?: string; status?: string }>;
}) {
  const { city: citySlug } = await params;
  const { property_type: typeFilter, status: statusFilter } = await searchParams;

  const city = await getCity(citySlug);
  if (!city) {
    notFound();
  }

  const supabase = createPublicClient();
  const [{ data: projectsRaw }, { data: cities }] = await Promise.all([
    supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("status_platform", "active")
      .eq("city_id", city.id)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("cities").select("id, name, slug").eq("is_active", true).order("display_order"),
  ]);

  let projects = (projectsRaw ?? []) as unknown as ProjectListCardData[];

  if (typeFilter) {
    projects = projects.filter((project) => project.property_type === typeFilter);
  }
  if (statusFilter) {
    projects = projects.filter((project) => project.status === statusFilter);
  }

  return (
    <>
      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">New Projects in {city.name}</h1>
        <p className="mt-2 text-base text-white/70">Off-plan and ready-to-move properties in {city.name}</p>
        <p className="mt-3 text-sm font-bold text-secondary">{projects.length} active projects</p>
      </div>

      <div className="sticky top-14 z-30">
        <Suspense fallback={<div className="h-[57px] border-b border-primary bg-white" />}>
          <ProjectsFilterBar cities={[]} hideCityFilter />
        </Suspense>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {projects.length === 0 ? (
          <div className="py-20 text-center text-primary-mid">No projects listed yet.</div>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {projects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} priority={index === 0} />
                ))}
              </div>
            </div>

            <div className="md:w-64 md:shrink-0">
              <ProjectsLinksSidebar cities={(cities ?? []).filter((c) => c.slug !== citySlug)} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
