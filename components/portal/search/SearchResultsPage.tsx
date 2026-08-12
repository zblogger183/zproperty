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
  searchParams,
  baseTypes,
  basePath: basePathProp,
  typeLabelOverride,
}: {
  purpose: "buy" | "rent";
  citySlug: string;
  areaSlug?: string;
  searchParams: Record<string, string | string[] | undefined>;
  // See fetchSearchResults' baseTypes doc — /commercial/[city] passes both
  // of these to scope the listing set and keep its own nav/pagination links
  // under /commercial/... instead of falling back to /buy/....
  baseTypes?: string[];
  basePath?: string;
  typeLabelOverride?: string;
}) {
  const results = await fetchSearchResults({ purpose, citySlug, areaSlug, searchParams, baseTypes });

  if (!results) {
    notFound();
  }

  const { city, area, filters, listings, total, totalPages, areaList, typeCounts } = results;

  const routeBase = basePathProp ?? `/${purpose}`;
  const purposeLabel = purpose === "buy" ? "Sale" : "Rent";
  const typeOption = TYPE_OPTIONS.find((option) => option.value === filters.type);
  const typeLabelBase = typeOption ? typeOption.label : (typeLabelOverride ?? "Property");
  const typeLabelPlural = typeLabelBase.endsWith("y")
    ? `${typeLabelBase.slice(0, -1)}ies`
    : `${typeLabelBase}s`;
  const typeLabel = total === 1 ? typeLabelBase : typeLabelPlural;
  const locationLabel = area?.name ?? city.name;
  const visibleTypeOptions = baseTypes
    ? TYPE_OPTIONS.filter((option) => baseTypes.includes(option.value))
    : TYPE_OPTIONS;

  function buildPageHref(page: number): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      const resolved = Array.isArray(value) ? value[0] : value;
      if (resolved) next.set(key, resolved);
    }
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    const basePath = area ? `${routeBase}/${city.slug}/${area.slug}/` : `${routeBase}/${city.slug}/`;
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* <Breadcrumb> already emits its own BreadcrumbList JSON-LD from these
          items, so no separate explicit breadcrumbSchema() call is added
          here — see the same note on the listing detail page. */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          area
            ? { label: city.name, href: `${routeBase}/${city.slug}/` }
            : { label: city.name },
          ...(area ? [{ label: area.name }] : []),
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
          </p>
        </div>

        <Suspense fallback={<div className="h-10 w-48 rounded-lg border border-primary bg-white" />}>
          <SortSelect />
        </Suspense>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <Suspense fallback={<div className="hidden w-64 shrink-0 md:block" />}>
          <FilterSidebar
            citySlug={city.slug}
            purpose={purpose}
            areaSlug={area?.slug}
            typeOptions={visibleTypeOptions}
            areaList={areaList}
            typeCounts={typeCounts}
            basePath={basePathProp}
          />
        </Suspense>

        <div className="flex-1">
          {listings.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold text-black">No properties found matching your filters.</p>
              <p className="mt-2 text-sm text-primary-mid">Try adjusting your search or browse all properties</p>
              <Link
                href={area ? `${routeBase}/${city.slug}/${area.slug}/` : `${routeBase}/${city.slug}/`}
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

        <LinksSidebar cityName={city.name} citySlug={city.slug} purpose={purpose} />
      </div>
    </div>
  );
}
