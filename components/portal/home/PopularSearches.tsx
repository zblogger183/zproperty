import Link from "next/link";

// min/max area_marla bracket each label to a tight ±0.5 marla band around
// the named size (matches FilterSidebar's own marla-button behavior) —
// "5 Marla House" now actually filters by size instead of just linking to
// the same unfiltered ?type=house every other size label pointed at.
const SEARCHES = [
  { label: "5 Marla House in Lahore", href: "/buy/lahore?type=house&min_area_marla=4.5&max_area_marla=5.5" },
  { label: "10 Marla House DHA", href: "/buy/lahore/dha?type=house&min_area_marla=9.5&max_area_marla=10.5" },
  { label: "Flat for Rent Gulberg", href: "/rent/lahore/gulberg?type=flat" },
  { label: "1 Kanal House Lahore", href: "/buy/lahore?type=house&min_area_marla=19.5&max_area_marla=20.5" },
  { label: "Double Story House Lahore", href: "/buy/lahore?type=house&floors=2" },
  { label: "Plot for Sale Bahria Town", href: "/buy/lahore/bahria-town?type=residential_plot" },
  { label: "Flat for Sale Karachi", href: "/buy/karachi?type=flat" },
  { label: "House for Sale Islamabad", href: "/buy/islamabad?type=house" },
  { label: "Office for Rent Lahore", href: "/rent/lahore?type=office" },
  { label: "New Projects Lahore", href: "/new-projects/city/lahore" },
  { label: "Commercial Plot DHA", href: "/buy/lahore/dha?type=commercial_plot" },
];

export function PopularSearches() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <span className="mr-3 inline text-sm font-semibold text-black">Popular Searches:</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {SEARCHES.map((search) => (
          <Link
            key={search.label}
            href={search.href}
            className="rounded-full border border-primary bg-white px-3 py-1.5 text-xs text-primary transition hover:border-secondary hover:text-primary-mid"
          >
            {search.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
