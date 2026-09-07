import Link from "next/link";

const TOOL_LINKS = [
  { emoji: "🧮", label: "EMI Calculator", href: "/tools/emi-calculator" },
  { emoji: "🏗", label: "Construction Cost", href: "/tools/construction-cost" },
  { emoji: "📐", label: "Area Converter", href: "/tools/area-converter" },
  { emoji: "📈", label: "ROI Calculator", href: "/tools/roi-calculator" },
];

export function ZipCodesSidebar({
  cities,
  currentCitySlug,
  cityName,
}: {
  /** Other cities to cross-link to (their own zip-code index pages). */
  cities: { name: string; slug: string }[];
  currentCitySlug?: string;
  cityName?: string;
}) {
  const otherCities = cities.filter((c) => c.slug !== currentCitySlug).slice(0, 8);

  return (
    <div>
      <div className="rounded-xl bg-primary p-4">
        <h2 className="text-sm font-bold text-white">
          {cityName ? `Ready to find a home in ${cityName}?` : "Ready to find your next property?"}
        </h2>
        <p className="mt-1 text-xs text-white/80">
          {cityName
            ? `Browse verified listings and new projects in ${cityName}.`
            : "Browse verified listings and new projects across Pakistan."}
        </p>
        <Link
          href={cityName ? `/buy/${currentCitySlug}` : "/"}
          className="mt-3 block w-full rounded-lg bg-secondary py-2.5 text-center text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          Browse Listings →
        </Link>
        {cityName && (
          <Link
            href={`/new-projects/city/${currentCitySlug}`}
            className="mt-2 block w-full rounded-lg border border-white/40 py-2 text-center text-xs font-bold text-white hover:bg-white/10"
          >
            New Projects in {cityName}
          </Link>
        )}
      </div>

      {otherCities.length > 0 && (
        <div className="mt-4 rounded-xl border border-primary bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-black">Zip Codes by City</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((city) => (
              <Link
                key={city.slug}
                href={`/zip-codes/city/${city.slug}`}
                className="rounded-lg border border-primary/30 px-2.5 py-1 text-xs text-primary hover:bg-primary hover:text-white"
              >
                {city.name}
              </Link>
            ))}
          </div>
          <Link href="/zip-codes" className="mt-3 block text-xs text-primary underline hover:text-primary-mid">
            View all cities →
          </Link>
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
        <h2 className="mb-2 text-sm font-bold text-black">List Your Property</h2>
        <p className="text-xs text-primary-mid">
          Are you an agent or developer? Reach verified buyers on ZProperty —{" "}
          <Link href="/register" className="text-primary underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
