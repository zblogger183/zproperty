import Link from "next/link";

const AREA_LINKS: Record<string, { label: string; slug: string }[]> = {
  lahore: [
    { label: "DHA", slug: "dha" },
    { label: "Bahria Town", slug: "bahria-town" },
    { label: "Gulberg", slug: "gulberg" },
    { label: "Model Town", slug: "model-town" },
    { label: "Johar Town", slug: "johar-town" },
    { label: "Garden Town", slug: "garden-town" },
    { label: "Cantt", slug: "cantt" },
  ],
  karachi: [
    { label: "DHA", slug: "dha" },
    { label: "Clifton", slug: "clifton" },
    { label: "PECHS", slug: "pechs" },
    { label: "Gulshan-e-Iqbal", slug: "gulshan-iqbal" },
    { label: "Bahria Town", slug: "bahria-town" },
  ],
  islamabad: [
    { label: "F-7", slug: "f-7" },
    { label: "F-10", slug: "f-10" },
    { label: "F-11", slug: "f-11" },
    { label: "E-11", slug: "e-11" },
    { label: "DHA", slug: "dha" },
  ],
};

const TOOL_LINKS = [
  { emoji: "🧮", label: "EMI Calculator", href: "/tools/emi-calculator" },
  { emoji: "🏗", label: "Construction Cost", href: "/tools/construction-cost" },
  { emoji: "📐", label: "Area Converter", href: "/tools/area-converter" },
  { emoji: "📈", label: "ROI Calculator", href: "/tools/roi-calculator" },
  { emoji: "🆚", label: "Rent vs Buy", href: "/tools/rent-vs-buy" },
  { emoji: "🧾", label: "Stamp Duty", href: "/tools/stamp-duty" },
];

export function LinksSidebar({
  cityName,
  citySlug,
  purpose,
}: {
  cityName: string;
  citySlug: string;
  purpose: "buy" | "rent";
}) {
  const base = `/${purpose}/${citySlug}`;
  const popularSearches =
    purpose === "buy"
      ? [
          { label: `5 Marla House in ${cityName}`, href: `${base}?type=house` },
          { label: `10 Marla House in ${cityName}`, href: `${base}?type=house` },
          { label: `1 Kanal House in ${cityName}`, href: `${base}?type=house` },
          { label: `2 Bed Flat in ${cityName}`, href: `${base}?type=flat&beds=2` },
          { label: `3 Bed Flat in ${cityName}`, href: `${base}?type=flat&beds=3` },
          { label: `Plot for Sale in ${cityName}`, href: `${base}?type=residential_plot` },
          { label: "Commercial Property", href: `/commercial/${citySlug}` },
        ]
      : [
          { label: `5 Marla House for Rent in ${cityName}`, href: `${base}?type=house` },
          { label: `10 Marla House for Rent in ${cityName}`, href: `${base}?type=house` },
          { label: `1 Kanal House for Rent in ${cityName}`, href: `${base}?type=house` },
          { label: `2 Bed Flat for Rent in ${cityName}`, href: `${base}?type=flat&beds=2` },
          { label: `3 Bed Flat for Rent in ${cityName}`, href: `${base}?type=flat&beds=3` },
          { label: `Office for Rent in ${cityName}`, href: `${base}?type=office` },
          { label: "Commercial Property", href: `/commercial/${citySlug}` },
        ];

  const areas = AREA_LINKS[citySlug] ?? [];

  return (
    <div className="hidden w-52 shrink-0 lg:block">
      <div className="rounded-xl border border-primary bg-white p-4">
        <p className="mb-3 text-sm font-bold text-black">Popular Searches</p>
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
          <p className="mb-3 text-sm font-bold text-black">Top Areas in {cityName}</p>
          {areas.map((area) => (
            <Link
              key={area.slug}
              href={`/buy/${citySlug}/${area.slug}`}
              className="block border-b border-primary/20 py-1 text-xs text-primary last:border-b-0 hover:text-primary-mid"
            >
              {area.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-primary bg-white p-4">
        <p className="mb-3 text-sm font-bold text-black">Property Tools</p>
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
        <p className="mb-3 text-sm font-bold text-black">Top Agents in {cityName}</p>
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
