import Link from "next/link";

const TOOL_LINKS = [
  { emoji: "🧮", label: "EMI Calculator", href: "/tools/emi-calculator" },
  { emoji: "🏗", label: "Construction Cost", href: "/tools/construction-cost" },
  { emoji: "📐", label: "Area Converter", href: "/tools/area-converter" },
  { emoji: "📈", label: "ROI Calculator", href: "/tools/roi-calculator" },
  { emoji: "🆚", label: "Rent vs Buy", href: "/tools/rent-vs-buy" },
  { emoji: "🧾", label: "Stamp Duty", href: "/tools/stamp-duty" },
];

export function ProjectsLinksSidebar({ cities }: { cities: { name: string; slug: string }[] }) {
  return (
    <div>
      {cities.length > 0 && (
        <div className="rounded-xl border border-primary bg-white p-4">
          <p className="mb-3 text-sm font-bold text-black">Browse by City</p>
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/new-projects/city/${city.slug}`}
              className="block border-b border-primary/20 py-1 text-xs text-primary last:border-b-0 hover:text-primary-mid"
            >
              New Projects in {city.name}
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
        <p className="mb-3 text-sm font-bold text-black">Are You a Developer?</p>
        <p className="text-xs text-primary-mid">
          List your project on ZProperty and reach verified buyers —{" "}
          <Link href="/contact" className="text-primary underline">
            Get in touch
          </Link>
        </p>
      </div>
    </div>
  );
}
