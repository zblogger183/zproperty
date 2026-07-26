import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DismissableBanner } from "@/components/dashboard/DismissableBanner";
import { ListingRow, type DashboardListingRow } from "@/components/dashboard/ListingRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "active", "pending", "paused", "rejected", "expired", "sold"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

export default async function AllListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; submitted?: string }>;
}) {
  const params = await searchParams;
  const status: StatusFilter = STATUS_TABS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  let listingsQuery = admin
    .from("listings")
    .select(
      `id, slug, title, status, purpose, type, price,
       area_marla, beds, baths, image_count, has_video,
       views_count, leads_count, calls_count, whatsapp_count,
       is_featured, is_hot_deal, featured_until,
       primary_image_url, created_at, published_at,
       expires_at, reject_reason,
       city:cities(name, slug), area:areas(name, slug)`,
      { count: "exact" },
    )
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status !== "all") {
    listingsQuery = listingsQuery.eq("status", status);
  }

  const [{ data: listingsRaw, count }, { data: allStatuses }] = await Promise.all([
    listingsQuery,
    admin.from("listings").select("status").eq("agent_id", user.id),
  ]);

  const listings = (listingsRaw ?? []) as unknown as DashboardListingRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusCounts = {
    all: allStatuses?.length ?? 0,
    active: allStatuses?.filter((l) => l.status === "active").length ?? 0,
    pending: allStatuses?.filter((l) => l.status === "pending").length ?? 0,
    paused: allStatuses?.filter((l) => l.status === "paused").length ?? 0,
    rejected: allStatuses?.filter((l) => l.status === "rejected").length ?? 0,
    expired: allStatuses?.filter((l) => l.status === "expired").length ?? 0,
    sold: allStatuses?.filter((l) => l.status === "sold").length ?? 0,
  };

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (status !== "all") next.set("status", status);
    if (page > 1) next.set("page", String(page));

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in overrides)) next.delete("page");

    const qs = next.toString();
    return qs ? `/dashboard/listings?${qs}` : "/dashboard/listings";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <Suspense fallback={null}>
        <DismissableBanner
          param="submitted"
          value="true"
          storageKey="listing-submitted-banner"
          message="✓ Your listing has been submitted for review. We'll notify you once it goes live (usually within 24 hours)."
        />
      </Suspense>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">My Listings</h1>
        <Link
          href="/dashboard/listings/new"
          className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + Add New Listing
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildHref({ status: tab === "all" ? undefined : tab })}
            className={`rounded-lg px-4 py-2 text-sm capitalize ${
              status === tab ? "bg-secondary font-bold text-primary" : "border border-primary bg-white text-primary"
            }`}
          >
            {tab} ({statusCounts[tab]})
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        {listings.length === 0 && status === "all" ? (
          <div className="py-20 text-center">
            <p className="text-base font-semibold text-black">You haven&apos;t added any listings yet.</p>
            <p className="mt-2 text-sm text-primary-mid">Add your first property to start getting leads.</p>
            <Link
              href="/dashboard/listings/new"
              className="mt-4 inline-block rounded-lg bg-secondary px-6 py-3 text-sm font-bold text-primary hover:bg-secondary-dark"
            >
              + Add Your First Listing
            </Link>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-12 text-center text-primary-mid">
            <p>No {status} listings.</p>
            <Link href="/dashboard/listings" className="text-primary underline">
              View all listings
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary text-xs text-white">
              <tr>
                <th className="w-16 px-4 py-3 text-left font-semibold">Image</th>
                <th className="px-4 py-3 text-left font-semibold">Title + Location</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Performance</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </table>
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
