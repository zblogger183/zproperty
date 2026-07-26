import Link from "next/link";

const SEARCHES = [
  { label: "5 Marla House in Lahore", href: "/buy/lahore?type=house" },
  { label: "10 Marla House DHA", href: "/buy/lahore/dha?type=house" },
  { label: "Flat for Rent Gulberg", href: "/rent/lahore/gulberg?type=flat" },
  { label: "1 Kanal House Lahore", href: "/buy/lahore?type=house" },
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
