import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/formatPrice";

export interface PerformanceListing {
  id: string;
  slug: string;
  title: string;
  status: string;
  views_count: number;
  leads_count: number;
  calls_count: number;
  whatsapp_count: number;
  price: number;
  purpose: "buy" | "rent";
  rental_period: "monthly" | "weekly" | "daily";
  primary_image_url: string | null;
  created_at: string;
  is_featured: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-secondary text-primary",
  pending: "bg-primary text-white",
  paused: "bg-primary-mid text-white",
  expired: "bg-primary-mid text-white",
};

export function ListingPerformanceCard({ listings }: { listings: PerformanceListing[] }) {
  return (
    <div className="rounded-xl border border-primary bg-white">
      <div className="flex items-center justify-between border-b border-primary px-5 py-4">
        <h2 className="text-base font-bold text-black">Listing Performance</h2>
        <Link href="/dashboard/listings" className="text-sm text-primary hover:text-primary-mid">
          View all →
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-primary-mid">No listings yet.</p>
          <Link href="/dashboard/listings/new" className="text-sm text-primary hover:underline">
            + Add your first listing
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-primary">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-3 px-5 py-3">
              <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg border border-primary">
                {listing.primary_image_url ? (
                  <Image src={listing.primary_image_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-mid text-xs text-white">
                    No img
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-black">
                  {listing.title}{" "}
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] capitalize ${
                      STATUS_STYLES[listing.status] ?? "bg-primary-mid text-white"
                    }`}
                  >
                    {listing.status}
                  </span>
                </p>
                <p className="text-xs text-primary-mid">
                  {formatPrice(listing.price, listing.purpose, listing.rental_period)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-black">
                  {listing.views_count.toLocaleString("en-PK")}
                  <span className="ml-1 text-[10px] font-normal text-primary-mid">views</span>
                </p>
                <p className="text-sm font-semibold text-black">
                  {listing.leads_count.toLocaleString("en-PK")}
                  <span className="ml-1 text-[10px] font-normal text-primary-mid">leads</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
