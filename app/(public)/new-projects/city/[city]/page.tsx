import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { ProjectCard, type ProjectListCardData } from "@/components/portal/projects/ProjectCard";
import { ProjectsFilterBar } from "@/components/portal/projects/ProjectsFilterBar";
import { ProjectsLinksSidebar } from "@/components/portal/projects/ProjectsLinksSidebar";

export const revalidate = 3600;

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 5;

const PROJECT_COLUMNS =
  "id, slug, name, tagline, property_type, status, min_price, max_price, total_units, completion_pct, cover_image_url, og_image_url, is_featured, is_verified, views_count, leads_count, city:cities(name, slug), area:areas(name, slug)";

async function getCity(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("cities").select("id, name, slug").eq("slug", slug).maybeSingle();
  return data;
}

type CityProjectsSearchParams = { property_type?: string; status?: string; page?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<CityProjectsSearchParams>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const { page: pageParam } = await searchParams;
  const city = await getCity(citySlug);

  if (!city) {
    return { title: "City not found | ZProperty.pk" };
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const baseTitle = `New Projects in ${city.name} — Off-Plan & Ready | ZProperty`;
  const baseDescription = `Browse new residential and commercial projects in ${city.name}. Pre-launch prices, payment plans, and developer contact.`;

  return {
    title: page > 1 ? `${baseTitle} — Page ${page}` : baseTitle,
    description: page > 1 ? `${baseDescription} (Page ${page}.)` : baseDescription,
    alternates: {
      canonical: page > 1 ? `/new-projects/city/${citySlug}?page=${page}` : `/new-projects/city/${citySlug}`,
    },
  };
}

export default async function NewProjectsCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<CityProjectsSearchParams>;
}) {
  const { city: citySlug } = await params;
  const { property_type: typeFilter, status: statusFilter, page: pageParam } = await searchParams;

  const city = await getCity(citySlug);
  if (!city) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order");

  // PostgREST 416s a .range() whose offset is past the last row, so the
  // total must be known (and the requested page clamped to it) BEFORE the
  // ranged query runs - otherwise an out-of-bounds ?page= silently comes
  // back as an errored request with count/data both null.
  let countQuery = supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status_platform", "active")
    .eq("city_id", city.id);
  if (typeFilter) countQuery = countQuery.eq("property_type", typeFilter);
  if (statusFilter) countQuery = countQuery.eq("status", statusFilter);
  const { count } = await countQuery;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  if (requestedPage > totalPages) {
    const params = new URLSearchParams();
    if (typeFilter) params.set("property_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (totalPages > 1) params.set("page", String(totalPages));
    const qs = params.toString();
    redirect(qs ? `/new-projects/city/${citySlug}?${qs}` : `/new-projects/city/${citySlug}`);
  }

  const page = requestedPage;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let projects: ProjectListCardData[] = [];
  if (total > 0) {
    let dataQuery = supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("status_platform", "active")
      .eq("city_id", city.id);
    if (typeFilter) dataQuery = dataQuery.eq("property_type", typeFilter);
    if (statusFilter) dataQuery = dataQuery.eq("status", statusFilter);
    const { data: projectsRaw } = await dataQuery
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    projects = (projectsRaw ?? []) as unknown as ProjectListCardData[];
  }

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (typeFilter) params.set("property_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/new-projects/city/${citySlug}?${qs}` : `/new-projects/city/${citySlug}`;
  }

  const pageNumbers = (() => {
    const pages: number[] = [];
    let start = Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2));
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  })();

  return (
    <>
      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">New Projects in {city.name}</h1>
        <p className="mt-2 text-base text-white/70">Off-plan and ready-to-move properties in {city.name}</p>
        <p className="mt-3 text-sm font-bold text-secondary">{total} active projects</p>
      </div>

      <div className="sticky top-14 z-30">
        <Suspense fallback={<div className="h-[57px] border-b border-primary bg-white" />}>
          <ProjectsFilterBar cities={[]} hideCityFilter />
        </Suspense>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
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

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">
                  <Link
                    href={buildPageHref(Math.max(1, page - 1))}
                    aria-disabled={page === 1}
                    className={`flex h-9 items-center rounded-lg border border-primary bg-white px-4 text-sm text-primary ${
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    Prev
                  </Link>

                  {pageNumbers.map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={buildPageHref(pageNumber)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
                        pageNumber === page
                          ? "bg-secondary font-bold text-primary"
                          : "border border-primary bg-white text-primary"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  ))}

                  <Link
                    href={buildPageHref(Math.min(totalPages, page + 1))}
                    aria-disabled={page === totalPages}
                    className={`flex h-9 items-center rounded-lg border border-primary bg-white px-4 text-sm text-primary ${
                      page === totalPages ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    Next
                  </Link>
                </nav>
              )}
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
