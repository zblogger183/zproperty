import { cache } from "react";
import type { Metadata } from "next";
import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient, backfillAgentContacts } from "@/lib/supabase/public";
import { areaGuideMeta } from "@/lib/seo/metadata";
import { SchemaScript, areaGuideSchema, societySchema } from "@/lib/seo/schemas";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ListingCard } from "@/components/portal/ListingCard";
import { ProjectCard, type ProjectListCardData } from "@/components/portal/projects/ProjectCard";
import { TiptapRenderer } from "@/components/portal/blog/TiptapRenderer";
import MiniMapLoader from "@/components/portal/listing/MiniMapLoader";
import type { ListingCardData } from "@/types";

export const revalidate = 86400;

interface CityRow {
  id: string;
  name: string;
  slug: string;
}

interface SocietyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  established_yr: number | null;
  developer_name: string | null;
  total_plots: number | null;
  total_phases: number | null;
  amenities: string[] | null;
  cover_image_url: string | null;
  avg_price_marla: number | null;
  listing_count: number;
  area_id: string | null;
  area: { slug: string } | null;
  meta_title: string | null;
  meta_desc: string | null;
  lat: number | null;
  lng: number | null;
  map_pdf_url: string | null;
}

interface AreaGuideRow {
  overview: string | null;
  content: JSONContent | null;
  pros: string[];
  cons: string[];
  nearby_places: Record<string, string[]> | null;
}

// generateMetadata and the page body both need city + society — cache()
// dedupes that to one Supabase round trip per request.
const getCityAndSociety = cache(async (citySlug: string, societySlug: string) => {
  const supabase = createPublicClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("slug", citySlug)
    .maybeSingle();

  if (!city) return { city: null, society: null };

  const { data: society } = await supabase
    .from("societies")
    .select(
      `id, name, slug, description, established_yr, developer_name, total_plots, total_phases,
       amenities, cover_image_url, avg_price_marla, listing_count, area_id, area:areas(slug),
       meta_title, meta_desc, lat, lng, map_pdf_url`,
    )
    .eq("slug", societySlug)
    .eq("city_id", city.id)
    .maybeSingle();

  return { city: city as CityRow, society: society as unknown as SocietyRow | null };
});

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("societies")
    .select("slug, city:cities(slug)")
    .eq("is_active", true);

  return ((data ?? []) as unknown as { slug: string; city: { slug: string } | null }[])
    .filter((society) => society.city)
    .map((society) => ({ city: society.city!.slug, society: society.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; society: string }>;
}): Promise<Metadata> {
  const { city: citySlug, society: societySlug } = await params;
  const { city, society } = await getCityAndSociety(citySlug, societySlug);

  if (!city || !society) {
    return { title: "Area guide not found | ZProperty.pk" };
  }

  const supabase = createPublicClient();
  const { data: areaGuide } = await supabase
    .from("area_guides")
    .select("meta_title, meta_desc")
    .eq("society_id", society.id)
    .maybeSingle();

  return areaGuideMeta({
    society_name: society.name,
    city_name: city.name,
    city_slug: citySlug,
    society_slug: societySlug,
    meta_title: areaGuide?.meta_title ?? society.meta_title,
    meta_desc: areaGuide?.meta_desc ?? society.meta_desc,
  });
}

export default async function AreaGuidePage({
  params,
}: {
  params: Promise<{ city: string; society: string }>;
}) {
  const { city: citySlug, society: societySlug } = await params;
  const { city, society } = await getCityAndSociety(citySlug, societySlug);

  if (!city || !society) {
    notFound();
  }

  const supabase = createPublicClient();

  const [{ data: areaGuide }, { data: listingsRaw }, { data: projectsRaw }] = await Promise.all([
    supabase
      .from("area_guides")
      .select("overview, content, pros, cons, nearby_places")
      .eq("society_id", society.id)
      .maybeSingle(),
    supabase
      .from("listings")
      .select(
        `id, slug, title, purpose, price, beds, baths, area_marla, primary_image_url, is_featured, is_hot_deal,
         agent_id, city:cities(name), area:areas(name), agent:public_agent_contact(name, whatsapp, profile_slug)`,
      )
      .eq("society_id", society.id)
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("projects")
      .select(
        `id, slug, name, tagline, property_type, status, min_price, max_price, total_units, completion_pct,
         cover_image_url, og_image_url, is_featured, is_verified, views_count, leads_count,
         city:cities(name, slug), area:areas(name, slug)`,
      )
      .eq("society_id", society.id)
      .eq("status_platform", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const guide = areaGuide as unknown as AreaGuideRow | null;
  const listings = await backfillAgentContacts(
    supabase,
    (listingsRaw ?? []) as unknown as ListingCardData[],
  );
  const projects = (projectsRaw ?? []) as unknown as ProjectListCardData[];

  const browseHref = society.area?.slug ? `/buy/${city.slug}/${society.area.slug}/` : `/buy/${city.slug}/`;
  const hasProsOrCons = (guide?.pros?.length ?? 0) > 0 || (guide?.cons?.length ?? 0) > 0;
  const nearbyEntries = guide?.nearby_places ? Object.entries(guide.nearby_places) : [];

  return (
    <>
      <SchemaScript
        schema={societySchema({
          name: society.name,
          slug: society.slug,
          city_slug: city.slug,
          description: guide?.overview ?? society.description,
          developer_name: society.developer_name,
          established_yr: society.established_yr,
          total_plots: society.total_plots,
          total_phases: society.total_phases,
          avg_price_marla: society.avg_price_marla,
          cover_image_url: society.cover_image_url,
          lat: society.lat,
          lng: society.lng,
        })}
      />
      <SchemaScript
        schema={areaGuideSchema({
          society_name: society.name,
          pros: guide?.pros ?? [],
          cons: guide?.cons ?? [],
        })}
      />

      <div className="mx-auto max-w-4xl px-6">
        <div className="pt-6">
          {/* <Breadcrumb> already emits its own BreadcrumbList JSON-LD — see
              the same note on the listing detail page. */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Area Guides", href: "/area-guide" },
              { label: city.name },
              { label: society.name },
            ]}
          />
        </div>

        <div
          className="relative mt-4 overflow-hidden rounded-xl bg-primary px-6 py-10 bg-cover bg-center"
          style={society.cover_image_url ? { backgroundImage: `url(${society.cover_image_url})` } : undefined}
        >
          {society.cover_image_url && <div className="absolute inset-0 bg-primary/80" />}
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white">{society.name}</h1>
            <p className="mt-1 text-base text-white/70">{city.name}</p>

            <div className="mt-4 flex flex-wrap gap-6">
              {society.established_yr && (
                <span className="text-sm text-white/70">Est. {society.established_yr}</span>
              )}
              {society.total_plots != null && (
                <span className="text-sm text-white/70">{society.total_plots} Plots</span>
              )}
              <span className="text-sm text-white/70">{society.listing_count} Active Listings</span>
              {society.avg_price_marla != null && (
                <span className="text-sm text-white/70">
                  PKR {society.avg_price_marla.toLocaleString("en-PK")}/Marla avg
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-xl border border-primary bg-white p-6">
              <h2 className="mb-4 text-xl font-bold text-black">Overview</h2>
              {guide?.overview ? (
                <p className="text-base leading-relaxed text-black">{guide.overview}</p>
              ) : guide?.content ? (
                <TiptapRenderer content={guide.content} />
              ) : (
                <p className="text-primary-mid">Area guide coming soon.</p>
              )}
            </div>

            {hasProsOrCons && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-secondary bg-white p-4">
                  <h3 className="mb-3 text-base font-bold text-black">Pros</h3>
                  <div className="space-y-2">
                    {(guide?.pros ?? []).map((pro) => (
                      <div key={pro} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                          ✓
                        </span>
                        <span className="text-sm text-black">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-primary bg-white p-4">
                  <h3 className="mb-3 text-base font-bold text-black">Cons</h3>
                  <div className="space-y-2">
                    {(guide?.cons ?? []).map((con) => (
                      <div key={con} className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          ×
                        </span>
                        <span className="text-sm text-black">{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {nearbyEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-bold text-black">Nearby Places</h3>
                <div className="grid grid-cols-2 gap-4">
                  {nearbyEntries.map(([category, places]) => (
                    <div key={category} className="rounded-xl border border-primary bg-white p-4">
                      <p className="text-sm font-semibold capitalize text-black">{category}</p>
                      <ul className="mt-2 list-disc pl-4 text-xs text-primary-mid">
                        {places.map((place) => (
                          <li key={place}>{place}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {society.amenities && society.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-bold text-black">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {society.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-secondary bg-white px-3 py-1.5 text-sm text-primary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">New Projects in {society.name}</h2>
                  <Link
                    href={`/new-projects/city/${city.slug}`}
                    className="text-sm text-primary hover:text-primary-mid"
                  >
                    View all →
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pb-12">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Properties in {society.name}</h2>
                <Link href={browseHref} className="text-sm text-primary hover:text-primary-mid">
                  View all →
                </Link>
              </div>

              {listings.length === 0 ? (
                <p className="mt-4 text-sm text-primary-mid">No active listings at the moment.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-3 rounded-xl border border-primary bg-white p-5">
              <h3 className="mb-3 text-base font-bold text-black">Quick Facts</h3>

              {society.developer_name && (
                <div className="flex justify-between border-b border-primary pb-2">
                  <span className="text-xs uppercase tracking-wider text-primary-mid">Developer</span>
                  <span className="text-sm font-semibold text-black">{society.developer_name}</span>
                </div>
              )}
              {society.established_yr && (
                <div className="flex justify-between border-b border-primary pb-2">
                  <span className="text-xs uppercase tracking-wider text-primary-mid">Established</span>
                  <span className="text-sm font-semibold text-black">{society.established_yr}</span>
                </div>
              )}
              {society.total_phases != null && (
                <div className="flex justify-between border-b border-primary pb-2">
                  <span className="text-xs uppercase tracking-wider text-primary-mid">Total Phases</span>
                  <span className="text-sm font-semibold text-black">{society.total_phases}</span>
                </div>
              )}
              {society.avg_price_marla != null && (
                <div className="flex justify-between border-b border-primary pb-2">
                  <span className="text-xs uppercase tracking-wider text-primary-mid">Avg Price/Marla</span>
                  <span className="text-sm font-semibold text-black">
                    PKR {society.avg_price_marla.toLocaleString("en-PK")}
                  </span>
                </div>
              )}
              {society.total_plots != null && (
                <div className="flex justify-between border-b border-primary pb-2">
                  <span className="text-xs uppercase tracking-wider text-primary-mid">Total Plots</span>
                  <span className="text-sm font-semibold text-black">{society.total_plots}</span>
                </div>
              )}

              <Link
                href={browseHref}
                className="mt-4 block w-full rounded-lg bg-secondary py-3 text-center text-sm font-bold text-primary hover:bg-secondary-dark"
              >
                Browse {society.listing_count} Listings
              </Link>

              {(society.lat != null && society.lng != null) || society.map_pdf_url ? (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-bold text-black">Location</h3>
                  {society.lat != null && society.lng != null && (
                    <MiniMapLoader lat={society.lat} lng={society.lng} title={society.name} />
                  )}
                  {society.map_pdf_url && (
                    <a
                      href={society.map_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block w-full rounded-lg border border-primary py-2.5 text-center text-sm font-semibold text-primary hover:bg-secondary/10"
                    >
                      Download Map (PDF)
                    </a>
                  )}
                </div>
              ) : null}

              {society.avg_price_marla != null && (
                <div className="mt-4 rounded-xl border border-primary bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-black">Price Comparison</p>
                  <p className="text-xs text-black">Avg price in {society.name}:</p>
                  <p className="text-lg font-bold text-black">
                    PKR {society.avg_price_marla.toLocaleString("en-PK")}/Marla
                  </p>
                  <p className="text-xs text-primary-mid">
                    As of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
