import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSearchResults } from "@/lib/search/fetchSearchResults";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ListingCard } from "@/components/portal/ListingCard";
import { FilterSidebar, type FilterTypeOption } from "./FilterSidebar";
import { LinksSidebar } from "./LinksSidebar";
import { SortSelect } from "./SortSelect";

const TYPE_OPTIONS: FilterTypeOption[] = [
  { value: "house", label: "House" },
  { value: "flat", label: "Flat" },
  { value: "upper_portion", label: "Upper Portion" },
  { value: "lower_portion", label: "Lower Portion" },
  { value: "room", label: "Room" },
  { value: "residential_plot", label: "Residential Plot" },
  { value: "commercial_plot", label: "Commercial Plot" },
  { value: "agricultural_land", label: "Agricultural Land" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
  { value: "building", label: "Building" },
  { value: "other", label: "Other" },
];

const MAX_VISIBLE_PAGES = 5;

export async function SearchResultsPage({
  purpose,
  citySlug,
  areaSlug,
  societySlug,
  searchParams,
  baseTypes,
  basePath: basePathProp,
  typeLabelOverride,
}: {
  purpose: "buy" | "rent";
  citySlug: string;
  areaSlug?: string;
  societySlug?: string;
  searchParams: Record<string, string | string[] | undefined>;
  // See fetchSearchResults' baseTypes doc — /commercial/[city] passes both
  // of these to scope the listing set and keep its own nav/pagination links
  // under /commercial/... instead of falling back to /buy/....
  baseTypes?: string[];
  basePath?: string;
  typeLabelOverride?: string;
}) {
  const results = await fetchSearchResults({ purpose, citySlug, areaSlug, societySlug, searchParams, baseTypes });

  if (!results) {
    notFound();
  }

  const { city, area, society, phase, filters, listings, total, totalPages, areaList, societyList, phaseList, typeCounts } =
    results;

  const routeBase = basePathProp ?? `/${purpose}`;
  const purposeLabel = purpose === "buy" ? "Sale" : "Rent";
  const typeOption = TYPE_OPTIONS.find((option) => option.value === filters.type);
  const typeLabelBase = typeOption ? typeOption.label : (typeLabelOverride ?? "Property");
  const typeLabelPlural = typeLabelBase.endsWith("y")
    ? `${typeLabelBase.slice(0, -1)}ies`
    : `${typeLabelBase}s`;
  const typeLabel = total === 1 ? typeLabelBase : typeLabelPlural;
  // "DHA Phase 6, Lahore" (area + phase carry the specificity; society name
  // usually just repeats the area/city and adds noise to the H1) — matches
  // the same composition searchMeta() uses for the indexed <title>.
  const locationLabel = [area?.name, phase?.name].filter(Boolean).join(" ") || society?.name || city.name;
  const visibleTypeOptions = baseTypes
    ? TYPE_OPTIONS.filter((option) => baseTypes.includes(option.value))
    : TYPE_OPTIONS;

  const societyBasePath = society ? `${routeBase}/${city.slug}/${area?.slug}/${society.slug}/` : null;

  function buildPageHref(page: number): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      const resolved = Array.isArray(value) ? value[0] : value;
      if (resolved) next.set(key, resolved);
    }
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    const basePath = societyBasePath ?? (area ? `${routeBase}/${city.slug}/${area.slug}/` : `${routeBase}/${city.slug}/`);
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pageNumbers = (() => {
    const pages: number[] = [];
    let start = Math.max(1, filters.page - Math.floor(MAX_VISIBLE_PAGES / 2));
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    for (let page = start; page <= end; page += 1) pages.push(page);
    return pages;
  })();

  const clearFiltersHref = societyBasePath ?? (area ? `${routeBase}/${city.slug}/${area.slug}/` : `${routeBase}/${city.slug}/`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* <Breadcrumb> already emits its own BreadcrumbList JSON-LD from these
          items, so no separate explicit breadcrumbSchema() call is added
          here — see the same note on the listing detail page. */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          area || society
            ? { label: city.name, href: `${routeBase}/${city.slug}/` }
            : { label: city.name },
          ...(area
            ? [society ? { label: area.name, href: `${routeBase}/${city.slug}/${area.slug}/` } : { label: area.name }]
            : []),
          ...(society ? [{ label: society.name }] : []),
        ]}
      />

      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">
            {total.toLocaleString()} {typeLabel} for {purposeLabel} in {locationLabel}
          </h1>
          <p className="mt-1 text-sm text-primary-mid">
            {city.name}
            {area ? ` > ${area.name}` : ""}
            {society ? ` > ${society.name}` : ""}
            {phase ? ` > ${phase.name}` : ""}
          </p>
        </div>

        <Suspense fallback={<div className="h-10 w-48 rounded-lg border border-primary bg-white" />}>
          <SortSelect />
        </Suspense>
      </div>

      {/* Real <Link> elements (not the JS-driven select the sidebar uses for
          city→area→society navigation) so search engines can actually
          discover "DHA Phase 6" as its own crawlable URL, not just something
          reachable by selecting a dropdown option. */}
      {society && phaseList.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-black">Browse by Phase:</span>
          <Link
            href={societyBasePath!}
            className={`rounded-full border px-3 py-1 text-xs ${
              !phase ? "border-primary bg-primary text-white" : "border-primary bg-white text-primary"
            }`}
          >
            All
          </Link>
          {phaseList.map((phaseOption) => (
            <Link
              key={phaseOption.id}
              href={`${societyBasePath}?phase=${phaseOption.slug}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                phase?.id === phaseOption.id
                  ? "border-primary bg-primary text-white"
                  : "border-primary bg-white text-primary"
              }`}
            >
              {phaseOption.name}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile only: the Filter button/drawer above the results, in the
          same spot it's always been. Hidden at md+, where the desktop slot
          below (sharing one column with LinksSidebar, on the right) takes
          over — FilterSidebar's own internal mobile/desktop classes make
          this safe to render twice without ever double-showing UI at any
          width, so this avoids depending on the `order-*` utilities, which
          this build isn't generating (a real, unrelated CSS output gap, not
          used elsewhere in this project either). */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <FilterSidebar
            citySlug={city.slug}
            purpose={purpose}
            areaSlug={area?.slug}
            societySlug={society?.slug}
            typeOptions={visibleTypeOptions}
            areaList={areaList}
            societyList={societyList}
            typeCounts={typeCounts}
            basePath={basePathProp}
          />
        </Suspense>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">
          {listings.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold text-black">No properties found matching your filters.</p>
              <p className="mt-2 text-sm text-primary-mid">Try adjusting your search or browse all properties</p>
              <Link
                href={clearFiltersHref}
                className="mt-4 inline-block rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Link
                href={buildPageHref(Math.max(1, filters.page - 1))}
                aria-disabled={filters.page === 1}
                className={`flex h-9 items-center rounded-lg border border-primary bg-white px-4 text-sm text-primary ${
                  filters.page === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Prev
              </Link>

              {pageNumbers.map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildPageHref(pageNumber)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
                    pageNumber === filters.page
                      ? "bg-secondary font-bold text-primary"
                      : "border border-primary bg-white text-primary"
                  }`}
                >
                  {pageNumber}
                </Link>
              ))}

              <Link
                href={buildPageHref(Math.min(totalPages, filters.page + 1))}
                aria-disabled={filters.page === totalPages}
                className={`flex h-9 items-center rounded-lg border border-primary bg-white px-4 text-sm text-primary ${
                  filters.page === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Next
              </Link>
            </div>
          )}
        </div>

        <div className="hidden md:block md:w-64 md:shrink-0">
          <Suspense fallback={<div className="hidden w-64 shrink-0 md:block" />}>
            <FilterSidebar
              citySlug={city.slug}
              purpose={purpose}
              areaSlug={area?.slug}
              societySlug={society?.slug}
              typeOptions={visibleTypeOptions}
              areaList={areaList}
              societyList={societyList}
              typeCounts={typeCounts}
              basePath={basePathProp}
            />
          </Suspense>

          <div className="mt-4 hidden lg:block">
            <LinksSidebar cityName={city.name} citySlug={city.slug} purpose={purpose} />
          </div>
        </div>
      </div>
    </div>
  );
}
