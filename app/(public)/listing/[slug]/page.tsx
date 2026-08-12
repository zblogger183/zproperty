import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingWithAgent, getSimilarListings, createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import { listingMeta } from "@/lib/seo/metadata";
import { SchemaScript, listingSchema } from "@/lib/seo/schemas";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ImageGallery } from "@/components/portal/listing/ImageGallery";
import { AgentCard } from "@/components/portal/listing/AgentCard";
import { SpecCard } from "@/components/portal/listing/SpecCard";
import { ViewTracker } from "@/components/portal/listing/ViewTracker";
import { ListingCard } from "@/components/portal/ListingCard";
import { SaveButton } from "@/components/portal/SaveButton";
import MiniMapDynamic from "@/components/portal/listing/MiniMapLoader";

export const revalidate = 300;

// TODO: replace with a real support number (or pull from `settings`) once
// one exists — this is the explicitly-requested hardcoded placeholder for
// listings with no assigned agent contact.
const SITE_WHATSAPP = "923001234567";

// generateMetadata and the page body both need the same listing — cache()
// dedupes that to a single Supabase round trip per request instead of two,
// without touching getListingWithAgent itself.
const getListing = cache(getListingWithAgent);

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("listings")
    .select("slug")
    .eq("status", "active")
    .order("views_count", { ascending: false })
    .limit(500);

  return (data ?? []).map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    return { title: "Listing not found | SarZameenz.com" };
  }

  return listingMeta({
    title: listing.title,
    slug: listing.slug,
    purpose: listing.purpose,
    type: listing.type,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    area_marla: listing.area_marla,
    description: listing.description,
    og_image_url: listing.og_image_url,
    area_name: listing.area?.name ?? "",
    city_name: listing.city?.name ?? "",
    agent_name: listing.agent?.name,
    meta_title: listing.meta_title,
    meta_desc: listing.meta_desc,
    robots: listing.robots,
    canonical_url: listing.canonical_url,
  });
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    notFound();
  }

  const supabase = createPublicClient();
  const similarListings = listing.city_id
    ? await getSimilarListings(supabase, listing.city_id, listing.type, listing.price, listing.id)
    : [];

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  let isSaved = false;
  if (user) {
    const { data: savedRow } = await authClient
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listing.id)
      .maybeSingle();
    isSaved = !!savedRow;
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(listing.city ? [{ label: listing.city.name, href: `/buy/${listing.city.slug}/` }] : []),
    ...(listing.city && listing.area
      ? [{ label: listing.area.name, href: `/buy/${listing.city.slug}/${listing.area.slug}/` }]
      : []),
    { label: listing.title.slice(0, 40) },
  ];

  const listingJsonLd = listingSchema({
    listing,
    agent: listing.agent,
    area_name: listing.area?.name ?? "",
    city_name: listing.city?.name ?? "",
  });

  const featureEntries = listing.features
    ? Object.entries(listing.features).filter(([, value]) => value === true)
    : [];

  return (
    <>
      <SchemaScript schema={listingJsonLd} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* <Breadcrumb> already emits its own BreadcrumbList JSON-LD from
            these items — a second explicit breadcrumbSchema() call here
            would just duplicate it (with slightly different, absolute-URL
            `item` values), so this is the only breadcrumb schema on the page. */}
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ImageGallery
              images={listing.listing_images}
              videoUrl={listing.video_url}
              title={listing.title}
            />

            <div className="lg:hidden">
              {listing.agent ? (
                <AgentCard agent={listing.agent} listingId={listing.id} listingTitle={listing.title} />
              ) : (
                <FallbackContactCard listingTitle={listing.title} />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold text-black">
                  {formatPrice(listing.price, listing.purpose)}
                </span>
                {listing.is_negotiable && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                    Negotiable
                  </span>
                )}
                <span
                  className={
                    listing.purpose === "buy"
                      ? "rounded-full bg-primary px-2 py-1 text-xs text-white"
                      : "rounded-full border border-primary bg-white px-2 py-1 text-xs text-primary"
                  }
                >
                  {listing.purpose === "buy" ? "For Sale" : "For Rent"}
                </span>
                <SaveButton
                  listingId={listing.id}
                  initialSaved={isSaved}
                  variant="labeled"
                  className="ml-auto"
                />
              </div>
              <h1 className="mt-2 text-xl font-bold text-black">{listing.title}</h1>
              {(listing.area || listing.city) && (
                <p className="mt-1 text-sm text-primary-mid">
                  {[listing.area?.name, listing.city?.name].filter(Boolean).join(", ")}
                </p>
              )}
              {(listing.society || listing.phase || listing.block || listing.plot_number) && (
                <p className="mt-1 text-sm text-primary-mid">
                  {[
                    listing.society?.name,
                    listing.phase?.name,
                    listing.block?.name,
                    listing.plot_number ? `Plot/House ${listing.plot_number}` : null,
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {!!listing.beds && <SpecCard icon="bed" value={listing.beds} label="Beds" />}
              {!!listing.baths && <SpecCard icon="bath" value={listing.baths} label="Baths" />}
              {!!listing.area_marla && (
                <SpecCard icon="ruler" value={`${listing.area_marla} Marla`} label="Area" />
              )}
              {listing.parking_spaces > 0 && (
                <SpecCard icon="car" value={listing.parking_spaces} label="Parking" />
              )}
              {!!listing.floors && <SpecCard icon="building" value={listing.floors} label="Floors" />}
              {listing.furnished_status !== "unfurnished" && (
                <SpecCard
                  icon="sofa"
                  value={listing.furnished_status.replace("_", " ")}
                  label="Furnished"
                />
              )}
            </div>

            {listing.description && (
              <div>
                <h2 className="text-lg font-bold text-black">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black">
                  {listing.description}
                </p>
              </div>
            )}

            {featureEntries.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-black">Features</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {featureEntries.map(([key]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                        ✓
                      </span>
                      <span className="text-sm capitalize text-black">{key.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {listing.lat != null && listing.lng != null && (
              <div>
                <h2 className="text-lg font-bold text-black">Location</h2>
                <div className="mt-3">
                  <MiniMapDynamic lat={listing.lat} lng={listing.lng} title={listing.title} />
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            {listing.agent ? (
              <AgentCard agent={listing.agent} listingId={listing.id} listingTitle={listing.title} />
            ) : (
              <FallbackContactCard listingTitle={listing.title} />
            )}
          </div>
        </div>

        {similarListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-black">Similar Properties</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {similarListings.map((similar) => (
                <ListingCard key={similar.id} listing={similar} />
              ))}
            </div>
          </div>
        )}

        <ViewTracker listingId={listing.id} />
      </div>
    </>
  );
}

function FallbackContactCard({ listingTitle }: { listingTitle: string }) {
  return (
    <div className="rounded-xl border-2 border-primary bg-white p-5 text-center">
      <p className="text-base font-bold text-black">Contact SarZameenz</p>
      <p className="mt-1 text-xs text-primary-mid">
        This listing doesn&apos;t have an assigned agent contact yet.
      </p>
      <a
        href={`https://wa.me/${SITE_WHATSAPP}?text=${encodeURIComponent(`Hi, I'm interested in ${listingTitle}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full rounded-lg bg-secondary py-3 text-sm font-bold text-primary"
      >
        💬 WhatsApp SarZameenz
      </a>
    </div>
  );
}
