import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { agentMeta } from "@/lib/seo/metadata";
import { SchemaScript, agentSchema } from "@/lib/seo/schemas";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ListingCard } from "@/components/portal/ListingCard";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/portal/SocialIcons";
import { AgentEnquiryForm } from "@/components/portal/agents/AgentEnquiryForm";
import type { ListingCardData } from "@/types";

export const revalidate = 600;

interface AgentProfileRow {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  profile_slug: string;
  headline: string | null;
  bio: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  languages: string[] | null;
  whatsapp: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  cnic_verified: boolean;
  subscription_tier: string;
  total_listings: number;
  active_listings: number;
  meta_title: string | null;
  meta_desc: string | null;
  og_image_url: string | null;
  agency_id: string | null;
}

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
}

// generateMetadata and the page body both need the same profile — cache()
// dedupes that to a single Supabase round trip per request.
const getProfile = cache(async (slug: string) => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("public_agent_profiles")
    .select(
      `user_id, name, avatar_url, profile_slug, headline, bio, experience_years,
       specialties, languages, whatsapp, facebook_url, instagram_url, youtube_url,
       cnic_verified, subscription_tier, total_listings, active_listings,
       meta_title, meta_desc, og_image_url, agency_id`,
    )
    .eq("profile_slug", slug)
    .maybeSingle();

  return data as unknown as AgentProfileRow | null;
});

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("public_agent_profiles").select("profile_slug");
  return (data ?? []).map((agent) => ({ slug: agent.profile_slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return { title: "Agent not found | SarZameenz.com" };
  }

  return agentMeta({
    name: profile.name ?? "Agent",
    profile_slug: profile.profile_slug,
    headline: profile.headline,
    city_names: [],
    meta_title: profile.meta_title,
    meta_desc: profile.meta_desc,
    og_image_url: profile.og_image_url,
  });
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    notFound();
  }

  const supabase = createPublicClient();

  const [{ data: listingsRaw }, agency] = await Promise.all([
    supabase
      .from("listings")
      .select(
        `id, slug, title, purpose, type, price, area_marla, beds, baths, primary_image_url,
         is_featured, is_hot_deal, agent_id, created_at,
         city:cities(name,slug), area:areas(name,slug)`,
      )
      .eq("agent_id", profile.user_id)
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12),
    profile.agency_id
      ? supabase.from("agencies").select("name, slug, logo_url").eq("id", profile.agency_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // No agent join here (no `.select("..., agent:public_agent_contact(...)")`)
  // — every card on this page is this same agent, so ListingCard's
  // agentOverride prop is used instead of a redundant identical join.
  const listings = (listingsRaw ?? []) as unknown as ListingCardData[];
  const agencyData = agency.data as { name: string; slug: string; logo_url: string | null } | null;

  const displayName = profile.name ?? "Agent";
  const firstName = displayName.split(" ")[0];
  const initial = displayName.trim().charAt(0).toUpperCase() || profile.profile_slug.charAt(0).toUpperCase();
  const cleanedWhatsapp = profile.whatsapp ? cleanPhone(profile.whatsapp) : null;
  const isPaidTier = profile.subscription_tier === "pro" || profile.subscription_tier === "elite";

  return (
    <>
      <SchemaScript
        schema={agentSchema({
          name: displayName,
          profile_slug: profile.profile_slug,
          headline: profile.headline,
          bio: profile.bio,
          whatsapp: profile.whatsapp,
          facebook_url: profile.facebook_url,
          instagram_url: profile.instagram_url,
          avatar_url: profile.avatar_url,
          experience_years: profile.experience_years ?? undefined,
          specialties: profile.specialties ?? undefined,
        })}
      />

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* <Breadcrumb> already emits its own BreadcrumbList JSON-LD — no
            separate breadcrumbSchema() call needed. */}
        <Breadcrumb items={[{ label: "Agents", href: "/agents" }, { label: displayName }]} />

        <div className="mt-4 flex flex-col gap-6 rounded-xl bg-primary p-6 md:flex-row md:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-secondary">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-mid text-4xl font-bold text-secondary">
                {initial}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            {profile.headline && <p className="mt-1 text-base text-white/70">{profile.headline}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {profile.cnic_verified && (
                <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
                  ✓ CNIC Verified
                </span>
              )}
              {isPaidTier && (
                <span className="rounded-full bg-primary-mid px-3 py-1.5 text-xs text-white">
                  {profile.subscription_tier === "elite" ? "Elite Agent" : "Pro Agent"}
                </span>
              )}
              {!!profile.experience_years && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white">
                  {profile.experience_years} Years Experience
                </span>
              )}
            </div>

            {profile.specialties && profile.specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full bg-primary-mid px-2 py-1 text-xs capitalize text-white"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-white/70">Speaks:</span>
                {profile.languages.map((language) => (
                  <span key={language} className="text-xs text-white">
                    {language}
                  </span>
                ))}
              </div>
            )}

            {(profile.facebook_url || profile.instagram_url || profile.youtube_url) && (
              <div className="mt-3 flex gap-3">
                {profile.facebook_url && (
                  <a
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-white hover:text-secondary"
                  >
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-white hover:text-secondary"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.youtube_url && (
                  <a
                    href={profile.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="text-white hover:text-secondary"
                  >
                    <YoutubeIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-8 border-t border-primary-mid pt-4">
              <div>
                <p className="text-xl font-bold text-secondary">{profile.active_listings}</p>
                <p className="text-xs text-primary-mid">Active Listings</p>
              </div>
              <div>
                <p className="text-xl font-bold text-secondary">{profile.total_listings}</p>
                <p className="text-xs text-primary-mid">Total Listed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-secondary">
                  {profile.experience_years ? `${profile.experience_years}` : "New Agent"}
                </p>
                <p className="text-xs text-primary-mid">{profile.experience_years ? "Years" : ""}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {profile.bio && (
              <div className="mb-6 rounded-xl border border-primary bg-white p-5">
                <h2 className="mb-3 text-base font-bold text-black">About {displayName}</h2>
                <p className="text-sm leading-relaxed text-black">{profile.bio}</p>
              </div>
            )}

            <h2 className="mb-4 text-xl font-bold text-black">Active Listings</h2>

            {listings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    agentOverride={{
                      name: displayName,
                      whatsapp: profile.whatsapp,
                      profile_slug: profile.profile_slug,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-primary-mid">
                <p>No active listings at the moment.</p>
                <p className="mt-1">Check back soon.</p>
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-24 rounded-xl border-2 border-primary bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-black">Contact {firstName}</h2>

              <AgentEnquiryForm agentId={profile.user_id} />

              <div className="my-4 border-t border-primary" />

              {cleanedWhatsapp ? (
                <>
                  <a
                    href={`https://wa.me/92${cleanedWhatsapp}?text=${encodeURIComponent(`Hi ${firstName}, I'm interested in your listings.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-secondary py-3 text-center text-sm font-bold text-primary"
                  >
                    💬 WhatsApp
                  </a>
                  <a
                    href={`tel:+92${cleanedWhatsapp}`}
                    className="mt-2 block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white"
                  >
                    📞 Call
                  </a>
                </>
              ) : (
                <p className="text-center text-sm text-primary-mid">Contact via enquiry form above</p>
              )}

              {agencyData && (
                <div className="mt-4 border-t border-primary pt-4">
                  <p className="mb-2 text-xs uppercase text-primary-mid">Agency</p>
                  <Link href={`/agencies/${agencyData.slug}`} className="flex items-center gap-2">
                    {agencyData.logo_url && (
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
                        <Image src={agencyData.logo_url} alt={agencyData.name} fill className="object-cover" />
                      </span>
                    )}
                    <span className="text-sm font-semibold text-primary hover:underline">{agencyData.name}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
