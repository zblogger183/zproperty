import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils/formatPrice";
import { formatPropertyId } from "@/lib/utils/formatPropertyId";
import { CityFilterSelect } from "@/components/admin/CityFilterSelect";
import { ListingSearchInput } from "@/components/admin/ListingSearchInput";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "All Listings | ZProperty Admin" };

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "active", "pending", "rejected", "paused", "expired", "sold"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary",
  pending: "bg-primary text-white",
  rejected: "border border-primary bg-white text-black",
  paused: "bg-primary-mid text-white",
  expired: "border border-primary bg-white text-primary-mid",
  sold: "bg-primary text-secondary",
};

interface AdminListingRow {
  id: string;
  listing_number: number;
  title: string;
  slug: string;
  status: string;
  purpose: "buy" | "rent";
  price: number;
  created_at: string;
  primary_image_url: string | null;
  city: { name: string } | null;
  agent: { name: string } | null;
}

export default async function AllListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; city?: string; purpose?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status: StatusFilter = STATUS_TABS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";
  const cityId = params.city;
  const purpose = params.purpose === "buy" || params.purpose === "rent" ? params.purpose : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim();

  const admin = createAdminClient();

  let query = admin
    .from("listings")
    .select(
      `id, listing_number, title, slug, status, purpose, type, price,
       beds, baths, area_marla, image_count, created_at,
       primary_image_url,
       city:cities(name), area:areas(name),
       agent:public_agent_contact(name)`,
      { count: "exact" },
    );

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (cityId) {
    query = query.eq("city_id", cityId);
  }
  if (purpose) {
    query = query.eq("purpose", purpose);
  }
  if (q) {
    // A pasted Property ID ("ZP-100001" or bare "100001") matches exactly;
    // anything else falls back to a partial title match, covering both the
    // "find this exact listing" and "find a listing about X" use cases.
    const idMatch = q.match(/^(?:zp-)?(\d+)$/i);
    if (idMatch) {
      query = query.eq("listing_number", Number(idMatch[1]));
    } else {
      query = query.ilike("title", `%${q}%`);
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data, count }, { data: cities }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    admin.from("cities").select("id, name").eq("is_active", true).order("display_order"),
  ]);

  const listings = (data ?? []) as unknown as AdminListingRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (status !== "all") next.set("status", status);
    if (cityId) next.set("city", cityId);
    if (purpose) next.set("purpose", purpose);
    if (q) next.set("q", q);
    if (page > 1) next.set("page", String(page));

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    // Changing a filter (as opposed to paginating) should reset to page 1.
    if (!("page" in overrides)) next.delete("page");

    const qs = next.toString();
    return qs ? `/admin/listings?${qs}` : "/admin/listings";
  }

  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-black">All Listings</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {total} total
        </span>
        <div className="ml-auto">
          <ListingSearchInput currentQuery={q} />
        </div>
      </div>

      <div className="mb-6 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-white p-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildHref({ status: tab === "all" ? undefined : tab })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              status === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab}
          </Link>
        ))}

        <div className="ml-auto">
          <CityFilterSelect cities={cities ?? []} currentCityId={cityId} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Image</th>
              <th className="px-4 py-3 text-left font-semibold">Property ID</th>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Agent</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3">
                  {listing.primary_image_url ? (
                    <div className="relative h-9 w-12 overflow-hidden rounded border border-primary">
                      <Image src={listing.primary_image_url} alt="" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-9 w-12 rounded bg-primary-mid" />
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-primary">
                  {formatPropertyId(listing.listing_number)}
                </td>
                <td className="max-w-[180px] truncate px-4 py-3 text-sm font-medium text-black">
                  <Link href={`/admin/listings/${listing.id}`} className="hover:underline">
                    {listing.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{listing.agent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">{listing.city?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-semibold text-black">
                  {formatPrice(listing.price, listing.purpose)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      STATUS_BADGE_CLASSES[listing.status] ?? ""
                    }`}
                  >
                    {listing.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {new Date(listing.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/listing/${listing.slug}`}
                    target="_blank"
                    className="text-xs text-primary underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {listings.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No listings match these filters.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={buildHref({ page: String(Math.max(1, page - 1)) })}
            aria-disabled={page === 1}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-primary text-primary ${
              page === 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ‹
          </Link>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildHref({ page: String(pageNumber) })}
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                pageNumber === page ? "bg-secondary text-primary" : "border border-primary text-primary"
              }`}
            >
              {pageNumber}
            </Link>
          ))}
          <Link
            href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
            aria-disabled={page === totalPages}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-primary text-primary ${
              page === totalPages ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ›
          </Link>
        </div>
      )}
    </div>
  );
}
