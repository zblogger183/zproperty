import Link from "next/link";
import Image from "next/image";

export interface DirectoryAgent {
  user_id: string;
  profile_slug: string;
  headline: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  cnic_verified: boolean;
  subscription_tier: string;
  active_listings: number;
  total_listings: number;
  whatsapp: string | null;
  cities_served: string[] | null;
  name: string | null;
  avatar_url: string | null;
}

export function AgentCard({ agent }: { agent: DirectoryAgent }) {
  const name = agent.name ?? "Agent";
  const initial = name.trim().charAt(0).toUpperCase() || agent.profile_slug.charAt(0).toUpperCase();
  const isPaidTier = agent.subscription_tier === "pro" || agent.subscription_tier === "elite";
  const specialties = agent.specialties ?? [];
  const visibleSpecialties = specialties.slice(0, 3);
  const extraCount = specialties.length - visibleSpecialties.length;

  return (
    <Link
      href={`/agents/${agent.profile_slug}`}
      className="block cursor-pointer rounded-xl border border-primary bg-white p-5 transition hover:border-2 hover:border-secondary"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-primary">
          {agent.avatar_url ? (
            <Image src={agent.avatar_url} alt={name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-secondary">
              {initial}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-black">{name}</p>
          {agent.headline && <p className="mt-0.5 line-clamp-1 text-xs text-primary-mid">{agent.headline}</p>}

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {agent.cnic_verified && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-secondary">
                ✓ CNIC
              </span>
            )}
            {isPaidTier && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                {agent.subscription_tier === "elite" ? "ELITE" : "PRO"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-4 border-t border-primary pt-3">
        <div>
          <span className="text-sm font-semibold text-black">{agent.active_listings}</span>{" "}
          <span className="text-xs text-primary-mid">active</span>
        </div>
        {!!agent.experience_years && (
          <div>
            <span className="text-sm font-semibold text-black">{agent.experience_years}yr</span>{" "}
            <span className="text-xs text-primary-mid">experience</span>
          </div>
        )}
      </div>

      {specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleSpecialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full border border-primary px-2 py-0.5 text-[10px] capitalize text-primary"
            >
              {specialty}
            </span>
          ))}
          {extraCount > 0 && <span className="text-[10px] text-primary-mid">+{extraCount} more</span>}
        </div>
      )}

      <span className="mt-4 block w-full rounded-lg bg-secondary py-2.5 text-center text-sm font-bold text-primary hover:bg-secondary-dark">
        View Profile
      </span>
    </Link>
  );
}
