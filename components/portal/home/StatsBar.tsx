export interface HomeStats {
  listings: number;
  agents: number;
  cities: number;
  users: number;
}

export function StatsBar({ stats }: { stats: HomeStats }) {
  const STATS = [
    { value: stats.listings.toLocaleString(), label: "Listings" },
    { value: stats.agents.toLocaleString(), label: "Agents" },
    { value: stats.cities.toLocaleString(), label: stats.cities === 1 ? "City" : "Cities" },
    { value: stats.users.toLocaleString(), label: "Registered Users" },
  ];

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
