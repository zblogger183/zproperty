import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

const AREA_LINKS_LIMIT = 24;

const TOOL_LINKS = [
  { emoji: "🧮", label: "EMI Calculator", href: "/tools/emi-calculator" },
  { emoji: "🏗", label: "Construction Cost", href: "/tools/construction-cost" },
  { emoji: "📐", label: "Area Converter", href: "/tools/area-converter" },
  { emoji: "📈", label: "ROI Calculator", href: "/tools/roi-calculator" },
  { emoji: "🆚", label: "Rent vs Buy", href: "/tools/rent-vs-buy" },
  { emoji: "🧾", label: "Stamp Duty", href: "/tools/stamp-duty" },
];

export async function LinksSidebar({
  cityName,
  citySlug,
  purpose,
  basePath,
}: {
  cityName: string;
  citySlug: string;
  purpose: "buy" | "rent";
  // Overrides the default /${purpose}/${citySlug} base for routes that
  // don't map onto a plain buy/rent split (/commercial, /plots) -- see
  // SearchResultsPage's own routeBase, which this mirrors. Without this,
  // every link here pointed at /buy/... even when rendered on a /rent or
  // /commercial page.
  basePath?: string;
}) {
  const base = basePath ?? `/${purpose}/${citySlug}`;

  // Real, DB-backed area links (not a 3-city hardcoded list) -- this is the
  // only place in the app that renders a crawlable <a> to a /buy|rent/[city]/
  // [area] page; FilterSidebar's equivalent area picker is a JS <select>
  // that Googlebot's crawler doesn't interact with, so without a real link
  // here, every one of these area pages exists to Google only as a bare
  // sitemap entry with no internal link signal -- which is exactly why GSC's
  // Indexing report showed hundreds of them "Discovered - currently not
  // indexed" and never crawled at all.
  const supabase = createPublicClient();
  const { data: city } = await supabase.from("cities").select("id").eq("slug", citySlug).maybeSingle();
  const { data: areaRows } = city
    ? await supabase
        .from("areas")
        .select("name, slug")
        .eq("city_id", city.id)
        .eq("is_active", true)
        .order("display_order")
        .limit(AREA_LINKS_LIMIT)
    : { data: null };
  const areas = areaRows ?? [];
  // Each size label gets its own real area_marla range (±0.5 marla, same
  // convention as FilterSidebar's marla buttons) — these used to all point
  // at the same unfiltered ?type=house regardless of the size in the label.
  const popularSearches =
    purpose === "buy"
      ? [
          { label: `5 Marla House in ${cityName}`, href: `${base}?type=house&min_area_marla=4.5&max_area_marla=5.5` },
          { label: `10 Marla House in ${cityName}`, href: `${base}?type=house&min_area_marla=9.5&max_area_marla=10.5` },
          { label: `1 Kanal House in ${cityName}`, href: `${base}?type=house&min_area_marla=19.5&max_area_marla=20.5` },
          { label: `Double Story House in ${cityName}`, href: `${base}?type=house&floors=2` },
          { label: `2 Bed Flat in ${cityName}`, href: `${base}?type=flat&beds=2` },
          { label: `3 Bed Flat in ${cityName}`, href: `${base}?type=flat&beds=3` },
          { label: `Plot for Sale in ${cityName}`, href: `${base}?type=residential_plot` },
          { label: "Commercial Property", href: `/commercial/${citySlug}` },
        ]
      : [
          { label: `5 Marla House for Rent in ${cityName}`, href: `${base}?type=house&min_area_marla=4.5&max_area_marla=5.5` },
          { label: `10 Marla House for Rent in ${cityName}`, href: `${base}?type=house&min_area_marla=9.5&max_area_marla=10.5` },
          { label: `1 Kanal House for Rent in ${cityName}`, href: `${base}?type=house&min_area_marla=19.5&max_area_marla=20.5` },
          { label: `Double Story House for Rent in ${cityName}`, href: `${base}?type=house&floors=2` },
          { label: `2 Bed Flat for Rent in ${cityName}`, href: `${base}?type=flat&beds=2` },
          { label: `3 Bed Flat for Rent in ${cityName}`, href: `${base}?type=flat&beds=3` },
          { label: `Office for Rent in ${cityName}`, href: `${base}?type=office` },
          { label: "Commercial Property", href: `/commercial/${citySlug}` },
        ];

  return (
    <div>
      <div className="rounded-xl border border-primary bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-black">Popular Searches</h2>
        {popularSearches.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block border-b border-primary/20 py-1 text-xs text-primary last:border-b-0 hover:text-primary-mid"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {areas.length > 0 && (
        <div className="mt-4 rounded-xl border border-primary bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-black">Top Areas in {cityName}</h2>
          {areas.map((area) => (
            <Link
              key={area.slug}
              href={`${base}/${area.slug}`}
              className="block border-b border-primary/20 py-1 text-xs text-primary last:border-b-0 hover:text-primary-mid"
            >
              {area.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-primary bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-black">Property Tools</h2>
        {TOOL_LINKS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="block border-b border-primary/20 py-1 text-xs text-primary last:border-b-0 hover:text-primary-mid"
          >
            {tool.emoji} {tool.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-primary bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-black">Top Agents in {cityName}</h2>
        <Link href="/agents" className="text-sm text-primary underline hover:text-primary-mid">
          Browse all agents →
        </Link>
        <p className="mt-2 text-xs text-primary-mid">Are you an agent?</p>
        <p className="text-xs text-primary-mid">
          List your property for free —{" "}
          <Link href="/register" className="text-primary underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
