import Link from "next/link";

const TILES = [
  { emoji: "🏠", label: "Houses for Sale", href: "/buy/lahore?type=house" },
  { emoji: "🏢", label: "Flats for Rent", href: "/rent/lahore?type=flat" },
  { emoji: "🟩", label: "Plots", href: "/buy/lahore?type=residential_plot" },
  { emoji: "🏪", label: "Commercial", href: "/commercial/lahore" },
  { emoji: "🏗", label: "New Projects", href: "/new-projects" },
  { emoji: "🔑", label: "Agents", href: "/agents" },
];

export function QuickLinksSection() {
  return (
    <section className="mx-auto max-w-7xl border-b border-primary px-4 py-8 md:px-6">
      <h2 className="mb-4 text-xl font-bold text-black">Browse by Property Type</h2>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="cursor-pointer rounded-xl border border-primary bg-white p-3 text-center transition hover:border-2 hover:border-secondary"
          >
            <span className="block text-2xl text-primary">{tile.emoji}</span>
            <span className="mt-1 block text-xs font-semibold text-black">{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
