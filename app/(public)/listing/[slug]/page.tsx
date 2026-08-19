import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingWithAgent, getSimilarListings, createPublicClient } from "@/lib/supabase/public";
import type { ListingDetailData } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import { formatPropertyId } from "@/lib/utils/formatPropertyId";
import { listingMeta } from "@/lib/seo/metadata";
import { SchemaScript, listingSchema } from "@/lib/seo/schemas";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ImageGallery } from "@/components/portal/listing/ImageGallery";
import { AgentCard } from "@/components/portal/listing/AgentCard";
import { SimpleContactCard } from "@/components/portal/listing/SimpleContactCard";
import { LinksSidebar } from "@/components/portal/search/LinksSidebar";
import { sanitizeRichText } from "@/lib/utils/sanitizeHtml";
import { SpecCard } from "@/components/portal/listing/SpecCard";
import { ViewTracker } from "@/components/portal/listing/ViewTracker";
import { ListingCard } from "@/components/portal/ListingCard";
import { SaveButton } from "@/components/portal/SaveButton";
import MiniMapDynamic from "@/components/portal/listing/MiniMapLoader";

export const revalidate = 300;

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
    return { title: "Listing not found | ZProperty.pk" };
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
    floors: listing.floors,
    description: listing.description,
    og_image_url: listing.og_image_url,
    area_name: listing.area?.name ?? "",
    city_name: listing.city?.name ?? "",
    society_name: listing.society?.name,
    phase_name: listing.phase?.name,
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
              <ListingContactCard listing={listing} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold text-black">
                  {formatPrice(listing.price, listing.purpose, listing.rental_period)}
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
              <p className="mt-1 text-xs text-primary-mid">
                Property ID: {formatPropertyId(listing.listing_number)}
              </p>
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
                <div
                  className="mt-2 text-sm leading-relaxed text-black [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(listing.description) }}
                />
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
            <ListingContactCard listing={listing} />
            {listing.city && (
              <div className="mt-4">
                <LinksSidebar cityName={listing.city.name} citySlug={listing.city.slug} purpose={listing.purpose} />
              </div>
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

        {listing.city && <ExploreMoreSection city={listing.city} area={listing.area} purpose={listing.purpose} />}

        <ViewTracker listingId={listing.id} />
      </div>
    </>
  );
}

// A listing-level contact (entered for a plot owner, or an agent's own
// override for this specific listing) always takes precedence over the
// assigned agent's profile contact when present.
function ListingContactCard({ listing }: { listing: ListingDetailData }) {
  const phone = listing.contact_phone || listing.agent?.phone || null;
  const whatsapp = listing.contact_whatsapp || listing.agent?.whatsapp || null;

  if (listing.agent) {
    return (
      <AgentCard
        agent={listing.agent}
        listingId={listing.id}
        listingTitle={listing.title}
        overridePhone={listing.contact_phone}
        overrideWhatsapp={listing.contact_whatsapp}
      />
    );
  }

  if (phone || whatsapp) {
    return (
      <SimpleContactCard
        listingId={listing.id}
        listingTitle={listing.title}
        phone={phone}
        whatsapp={whatsapp}
      />
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary bg-white p-5 text-center">
      <p className="text-sm text-primary-mid">Contact info isn&apos;t available for this listing yet.</p>
    </div>
  );
}

// Always-available internal links (not dependent on real inventory existing
// yet) so a listing page is never a dead end even when there's nothing to
// show in "Similar Properties" — real estate portals keep visitors browsing
// from every page, and this is also meaningful internal linking for SEO.
function ExploreMoreSection({
  city,
  area,
  purpose,
}: {
  city: { name: string; slug: string };
  area: { name: string; slug: string } | null;
  purpose: "buy" | "rent";
}) {
  const base = `/${purpose}/${city.slug}`;
  const purposeLabel = purpose === "buy" ? "Sale" : "Rent";

  const links = [
    area
      ? { label: `More in ${area.name}, ${city.name}`, href: `${base}/${area.slug}` }
      : { label: `All Listings in ${city.name}`, href: base },
    { label: `Houses for ${purposeLabel} in ${city.name}`, href: `${base}?type=house` },
    { label: `Flats for ${purposeLabel} in ${city.name}`, href: `${base}?type=flat` },
    { label: `Plots in ${city.name}`, href: `/plots/${city.slug}` },
    { label: `Commercial in ${city.name}`, href: `/commercial/${city.slug}` },
    { label: `New Projects in ${city.name}`, href: `/new-projects/city/${city.slug}` },
    { label: "Browse Agents", href: "/agents" },
  ];

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-black">Explore More</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-full border border-primary bg-white px-3 py-1.5 text-xs text-primary transition hover:border-secondary hover:text-primary-mid"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
