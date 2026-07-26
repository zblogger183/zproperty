// Hardcoded for now, per spec — make editable via the settings table later
// (see admin/content/homepage for where that would eventually be wired up).
const STATS = [
  { value: "12,500+", label: "Listings" },
  { value: "2,800+", label: "Agents" },
  { value: "3", label: "Cities" },
  { value: "50,000+", label: "Happy Users" },
];

export function StatsBar() {
  return (
    <section className="bg-primary px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-16">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-4xl font-bold text-secondary">{stat.value}</p>
            <p className="mt-1 text-sm text-white">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
