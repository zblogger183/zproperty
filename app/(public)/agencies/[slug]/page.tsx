import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ListingCard } from "@/components/portal/ListingCard";
import type { ListingCardData } from "@/types";

export const revalidate = 600;

interface AgencyData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  cities_served: string[] | null;
  established_yr: number | null;
  total_agents: number | null;
  total_listings: number | null;
  is_verified: boolean;
  meta_title: string | null;
  meta_desc: string | null;
}

async function getAgency(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("agencies")
    .select(
      `id, name, slug, logo_url, cover_url, description, address, phone, email, website, whatsapp,
       cities_served, established_yr, total_agents, total_listings, is_verified, meta_title, meta_desc`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data as AgencyData | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgency(slug);

  if (!agency) return { title: "Agency not found | ZProperty.pk" };

  return {
    title: agency.meta_title ?? `${agency.name} | ZProperty.pk`,
    description: agency.meta_desc ?? agency.description ?? undefined,
  };
}

export default async function AgencyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgency(slug);

  if (!agency) notFound();

  const supabase = createPublicClient();

  const { data: agentRows } = await supabase
    .from("agent_profiles")
    .select("user_id, profile_slug, users(id, name, avatar_url)")
    .eq("agency_id", agency.id);

  const agentIds = (agentRows ?? []).map((row) => row.user_id);

  const { data: listingsRaw } =
    agentIds.length > 0
      ? await supabase
          .from("listings")
          .select(
            `id, slug, title, purpose, price, beds, baths, area_marla, primary_image_url, is_featured, is_hot_deal,
             city:cities(name), area:areas(name),
             agent_id, agent:public_agent_contact(name, whatsapp, profile_slug)`,
          )
          .in("agent_id", agentIds)
          .eq("status", "active")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(24)
      : { data: [] };

  const listings = (listingsRaw ?? []) as unknown as ListingCardData[];

  return (
    <div>
      <div className="relative h-40 w-full bg-primary md:h-56">
        {agency.cover_url && <Image src={agency.cover_url} alt="" fill className="object-cover opacity-40" />}
      </div>

      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="-mt-12 flex items-end gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow">
            {agency.logo_url ? (
              <Image src={agency.logo_url} alt={agency.name} width={96} height={96} className="object-contain" />
            ) : (
              <span className="text-3xl font-bold text-primary">{agency.name.charAt(0)}</span>
            )}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-black">{agency.name}</h1>
              {agency.is_verified && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
                  ✓ Verified
                </span>
              )}
            </div>
            {agency.cities_served && agency.cities_served.length > 0 && (
              <p className="text-sm text-primary-mid">{agency.cities_served.join(", ")}</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {agency.description && (
              <div>
                <h2 className="text-lg font-bold text-black">About {agency.name}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black">{agency.description}</p>
              </div>
            )}

            <h2 className="mt-8 text-lg font-bold text-black">Active Listings ({listings.length})</h2>
            {listings.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-primary-mid">No active listings from this agency right now.</p>
            )}
          </div>

          <div>
            <div className="rounded-xl border border-primary bg-white p-5">
              <h2 className="mb-3 text-sm font-bold uppercase text-primary-mid">Agency Info</h2>
              <dl className="space-y-2 text-sm">
                {agency.established_yr && (
                  <div className="flex justify-between border-b border-primary pb-2">
                    <dt className="text-primary-mid">Established</dt>
                    <dd className="text-black">{agency.established_yr}</dd>
                  </div>
                )}
                <div className="flex justify-between border-b border-primary pb-2">
                  <dt className="text-primary-mid">Agents</dt>
                  <dd className="text-black">{agentRows?.length ?? 0}</dd>
                </div>
                {agency.address && (
                  <div className="flex justify-between gap-3 border-b border-primary pb-2">
                    <dt className="shrink-0 text-primary-mid">Address</dt>
                    <dd className="text-right text-black">{agency.address}</dd>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex justify-between border-b border-primary pb-2">
                    <dt className="text-primary-mid">Phone</dt>
                    <dd className="text-black">{agency.phone}</dd>
                  </div>
                )}
                {agency.email && (
                  <div className="flex justify-between pb-2">
                    <dt className="text-primary-mid">Email</dt>
                    <dd className="text-black">{agency.email}</dd>
                  </div>
                )}
              </dl>

              {agency.whatsapp && (
                <a
                  href={`https://wa.me/${agency.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block rounded-lg bg-secondary py-2.5 text-center text-sm font-bold text-primary"
                >
                  💬 WhatsApp Agency
                </a>
              )}
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block rounded-lg border border-primary py-2.5 text-center text-sm text-primary"
                >
                  Visit Website
                </a>
              )}
            </div>

            {agentRows && agentRows.length > 0 && (
              <div className="mt-4 rounded-xl border border-primary bg-white p-5">
                <h2 className="mb-3 text-sm font-bold uppercase text-primary-mid">Agents</h2>
                <div className="flex flex-col gap-2">
                  {agentRows.map((row) => {
                    const agentUser = row.users as unknown as { id: string; name: string } | null;
                    if (!agentUser) return null;
                    return (
                      <Link
                        key={agentUser.id}
                        href={`/agents/${row.profile_slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {agentUser.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
