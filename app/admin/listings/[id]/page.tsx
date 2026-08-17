import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Phone, MessageCircle, Mail, FileText, type LucideIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils/formatPrice";
import { TYPE_LABELS } from "@/components/dashboard/listing-form/styles";
import { ListingStatusActions } from "@/components/admin/ListingStatusActions";
import { FeatureListingButton } from "@/components/admin/FeatureListingButton";
import type { Step1Data } from "@/app/dashboard/listings/schemas";
import { sanitizeRichText } from "@/lib/utils/sanitizeHtml";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Listing Detail | ZProperty Admin" };

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary font-bold",
  pending: "bg-primary text-white",
  paused: "bg-primary-mid text-white",
  rejected: "border border-primary bg-white text-black",
  expired: "border border-primary bg-white text-primary-mid",
  sold: "bg-primary text-secondary",
};

const LEAD_TYPE_ICONS: Record<string, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  form: FileText,
};

const LEAD_STATUS_BADGE_CLASSES: Record<string, string> = {
  new: "bg-primary text-white",
  contacted: "bg-primary-mid text-white",
  viewing: "bg-primary-mid text-white",
  negotiating: "bg-primary-mid text-white",
  won: "bg-secondary text-primary",
  lost: "border border-primary bg-white text-primary-mid",
  spam: "border border-primary bg-white text-primary-mid",
};

interface ListingDetail {
  id: string;
  slug: string;
  title: string;
  purpose: "buy" | "rent";
  type: Step1Data["type"];
  status: string;
  price: number;
  beds: number | null;
  baths: number | null;
  area_marla: number | null;
  area_sqft: number | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  views_count: number;
  leads_count: number;
  calls_count: number;
  is_featured: boolean;
  is_hot_deal: boolean;
  featured_until: string | null;
  reject_reason: string | null;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  image_count: number;
  cities: { name: string; slug: string } | null;
  areas: { name: string; slug: string } | null;
  agent: { id: string; name: string; email: string | null; phone: string | null } | null;
}

interface ListingImageRow {
  id: string;
  large_url: string;
  thumb_url: string;
  is_primary: boolean;
  display_order: number;
}

interface LeadRow {
  id: string;
  lead_type: string;
  name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  message: string | null;
}

export default async function AdminListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: listingRaw }, { data: imagesRaw }, { data: leadsRaw }] = await Promise.all([
    admin
      .from("listings")
      .select(
        `
        id, slug, title, purpose, type, status,
        price, beds, baths, area_marla, area_sqft,
        description, address, lat, lng,
        views_count, leads_count, calls_count,
        is_featured, is_hot_deal, featured_until,
        reject_reason, created_at, published_at,
        expires_at, image_count,
        cities(name, slug),
        areas(name, slug),
        agent:users!listings_agent_id_fkey(
          id, name, email, phone
        )
      `,
      )
      .eq("id", id)
      .single(),
    admin
      .from("listing_images")
      .select("id, large_url, thumb_url, is_primary, display_order")
      .eq("listing_id", id)
      .order("display_order"),
    admin
      .from("leads")
      .select("id, lead_type, name, phone, status, created_at, message")
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!listingRaw) notFound();

  const listing = listingRaw as unknown as ListingDetail;
  const images = (imagesRaw ?? []) as ListingImageRow[];
  const leads = (leadsRaw ?? []) as LeadRow[];

  const location = [listing.areas?.name, listing.cities?.name].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <nav className="text-sm text-primary-mid">
        <Link href="/admin" className="hover:text-primary hover:underline">
          Admin
        </Link>
        {" > "}
        <Link href="/admin/listings" className="hover:text-primary hover:underline">
          All Listings
        </Link>
        {" > "}
        <span className="text-black">{listing.title.length > 40 ? `${listing.title.slice(0, 40)}…` : listing.title}</span>
      </nav>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{listing.title}</h1>
          {location && <p className="mt-1 text-sm text-primary-mid">{location}</p>}
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs capitalize ${
              STATUS_BADGE_CLASSES[listing.status] ?? ""
            }`}
          >
            {listing.status}
          </span>
        </div>

        <div className="flex flex-col items-end gap-3">
          <ListingStatusActions listingId={listing.id} status={listing.status} />
          <Link href="/admin/listings" className="text-sm text-primary underline">
            ← Back to Listings
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-black">Photos ({listing.image_count})</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-video overflow-hidden rounded-xl border border-primary"
                  >
                    <Image src={image.large_url} alt="" fill className="object-cover" />
                    {image.is_primary && (
                      <span className="absolute left-1 top-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-primary-mid">No photos uploaded</p>
            )}
          </div>

          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-black">Listing Details</h2>
            <dl className="grid grid-cols-2 gap-x-6">
              <DetailRow label="Purpose" value={listing.purpose === "buy" ? "Buy" : "Rent"} />
              <DetailRow label="Type" value={TYPE_LABELS[listing.type] ?? listing.type} />
              <DetailRow label="Price" value={formatPrice(listing.price, listing.purpose)} />
              <DetailRow label="Beds" value={listing.beds ?? "—"} />
              <DetailRow label="Baths" value={listing.baths ?? "—"} />
              <DetailRow label="Area" value={listing.area_marla ? `${listing.area_marla} Marla` : "—"} />
              <DetailRow label="City" value={listing.cities?.name ?? "—"} />
              <DetailRow label="Area" value={listing.areas?.name ?? "—"} />
              <DetailRow label="Views" value={listing.views_count} />
              <DetailRow label="Leads" value={listing.leads_count} />
              <DetailRow label="Submitted" value={format(new Date(listing.created_at), "MMM d, yyyy")} />
              <DetailRow
                label="Published"
                value={listing.published_at ? format(new Date(listing.published_at), "MMM d, yyyy") : "—"}
              />
              <DetailRow
                label="Expires"
                value={listing.expires_at ? format(new Date(listing.expires_at), "MMM d, yyyy") : "—"}
              />
            </dl>
          </div>

          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-black">Description</h2>
            {listing.description ? (
              <div
                className="text-sm leading-relaxed text-black [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(listing.description) }}
              />
            ) : (
              <p className="text-sm italic text-primary-mid">No description</p>
            )}
          </div>

          {listing.status === "rejected" && listing.reject_reason && (
            <div className="mb-4 rounded-xl border-l-4 border-primary bg-white p-4">
              <p className="text-sm font-semibold text-black">Rejection Reason:</p>
              <p className="mt-1 text-sm text-primary-mid">{listing.reject_reason}</p>
            </div>
          )}

          <div className="rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-black">Recent Leads ({leads.length})</h2>
            {leads.length > 0 ? (
              <div className="space-y-2">
                {leads.map((lead) => {
                  const Icon = LEAD_TYPE_ICONS[lead.lead_type] ?? FileText;
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 border-b border-primary py-2 last:border-b-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Icon className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                      </span>
                      <span className="text-sm text-black">
                        {lead.name ?? "Anonymous"}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-primary-mid">
                        {format(new Date(lead.created_at), "MMM d, h:mm a")}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize ${
                          LEAD_STATUS_BADGE_CLASSES[lead.status] ?? ""
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-primary-mid">No leads yet</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 rounded-xl border border-primary bg-white p-5">
            <p className="mb-3 text-xs uppercase text-primary-mid">Agent</p>
            {listing.agent ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-secondary">
                  {listing.agent.name.charAt(0).toUpperCase()}
                </div>
                <p className="mt-2 text-base font-bold text-black">{listing.agent.name}</p>
                <p className="text-xs text-primary-mid">{listing.agent.email ?? "—"}</p>
                <p className="text-xs text-primary-mid">{listing.agent.phone ?? "—"}</p>
                <Link
                  href={`/admin/users/agents/${listing.agent.id}`}
                  className="mt-3 block text-xs text-primary underline"
                >
                  View Agent Profile
                </Link>
              </>
            ) : (
              <p className="text-sm text-primary-mid">No agent assigned</p>
            )}
          </div>

          <div className="rounded-xl border border-primary bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-black">Quick Actions</h2>
            <div className="space-y-2">
              <FeatureListingButton listingId={listing.id} isFeatured={listing.is_featured} />
              {listing.status === "active" && (
                <Link
                  href={`/listing/${listing.slug}`}
                  target="_blank"
                  className="block w-full rounded-lg border border-primary bg-white py-2 text-center text-sm text-primary"
                >
                  View live listing
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-primary py-2 last:border-b-0">
      <dt className="text-xs uppercase tracking-wide text-primary-mid">{label}</dt>
      <dd className="text-sm font-semibold text-black">{value}</dd>
    </div>
  );
}
