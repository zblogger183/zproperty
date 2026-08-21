import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ProjectCard, type ProjectListCardData } from "@/components/portal/projects/ProjectCard";
import { ProjectsFilterBar } from "@/components/portal/projects/ProjectsFilterBar";
import { ProjectsLinksSidebar } from "@/components/portal/projects/ProjectsLinksSidebar";

export const revalidate = 3600;

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 5;

type NewProjectsSearchParams = { city?: string; property_type?: string; status?: string; page?: string };

const BASE_TITLE = "New Property Projects in Pakistan — Off-Plan & Ready | ZProperty";
const BASE_DESCRIPTION =
  "Browse new residential and commercial projects in Lahore, Karachi and Islamabad. Pre-launch prices, payment plans, and developer contact.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<NewProjectsSearchParams>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return {
    title: page > 1 ? `${BASE_TITLE} — Page ${page}` : BASE_TITLE,
    description: BASE_DESCRIPTION,
    alternates: { canonical: page > 1 ? `/new-projects?page=${page}` : "/new-projects" },
  };
}

const PROJECT_COLUMNS =
  "id, slug, name, tagline, property_type, status, min_price, max_price, total_units, completion_pct, cover_image_url, og_image_url, is_featured, is_verified, views_count, leads_count, city:cities(name, slug), area:areas(name, slug)";

export default async function NewProjectsPage({
  searchParams,
}: {
  searchParams: Promise<NewProjectsSearchParams>;
}) {
  const { city: cityFilter, property_type: typeFilter, status: statusFilter, page: pageParam } = await searchParams;
  const supabase = createPublicClient();

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order");

  const cityId = cityFilter ? (cities ?? []).find((city) => city.slug === cityFilter)?.id : undefined;

  // PostgREST 416s a .range() whose offset is past the last row, so the
  // total must be known (and the requested page clamped to it) BEFORE the
  // ranged query runs - otherwise an out-of-bounds ?page= silently comes
  // back as an errored request with count/data both null.
  let countQuery = supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status_platform", "active");
  if (cityId) countQuery = countQuery.eq("city_id", cityId);
  if (typeFilter) countQuery = countQuery.eq("property_type", typeFilter);
  if (statusFilter) countQuery = countQuery.eq("status", statusFilter);
  const { count } = await countQuery;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  if (requestedPage > totalPages) {
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (typeFilter) params.set("property_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (totalPages > 1) params.set("page", String(totalPages));
    const qs = params.toString();
    redirect(qs ? `/new-projects?${qs}` : "/new-projects");
  }

  const page = requestedPage;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let projects: ProjectListCardData[] = [];
  if (total > 0) {
    let dataQuery = supabase.from("projects").select(PROJECT_COLUMNS).eq("status_platform", "active");
    if (cityId) dataQuery = dataQuery.eq("city_id", cityId);
    if (typeFilter) dataQuery = dataQuery.eq("property_type", typeFilter);
    if (statusFilter) dataQuery = dataQuery.eq("status", statusFilter);
    const { data: projectsRaw } = await dataQuery
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    projects = (projectsRaw ?? []) as unknown as ProjectListCardData[];
  }

  // Only page 1 gets the "Featured Projects" spotlight treatment - later
  // pages just show a plain grid, since splitting an already-paginated
  // slice into featured/non-featured sub-sections would be confusing.
  const featured = page === 1 ? projects.filter((project) => project.is_featured) : [];
  const rest = page === 1 ? projects.filter((project) => !project.is_featured) : projects;

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (typeFilter) params.set("property_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/new-projects?${qs}` : "/new-projects";
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
        <h1 className="text-3xl font-bold text-white">New Projects</h1>
        <p className="mt-2 text-base text-white/70">Off-plan and ready-to-move properties across Pakistan</p>
        <p className="mt-3 text-sm font-bold text-secondary">{total} active projects</p>
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
                  {featured.length > 0
                    ? `${rest.length} More ${rest.length === 1 ? "Project" : "Projects"}`
                    : `${total} ${total === 1 ? "Project" : "Projects"}${totalPages > 1 ? ` — Page ${page} of ${totalPages}` : ""}`}
                </h2>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {rest.map((project) => (
                  <ProjectCard key={project.id} project={project} />
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
              <ProjectsLinksSidebar cities={cities ?? []} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
