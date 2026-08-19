import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils/formatPrice";

export interface RecentPendingListing {
  id: string;
  title: string;
  type: string;
  purpose: "buy" | "rent";
  rental_period: "monthly" | "weekly" | "daily";
  price: number;
  created_at: string;
  agent: { name: string } | null;
}

export function RecentPendingTable({ listings }: { listings: RecentPendingListing[] }) {
  return (
    <div className="rounded-xl border border-primary bg-white">
      <div className="flex items-center justify-between border-b border-primary px-5 py-4">
        <h2 className="text-base font-bold text-black">Pending Listings</h2>
        <Link href="/admin/listings/pending" className="text-sm text-primary hover:text-primary-mid">
          View all →
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="py-8 text-center text-sm text-primary-mid">No listings pending approval</p>
      ) : (
        <table className="w-full table-fixed text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Agent</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Time</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="truncate px-4 py-3 font-medium text-black">{listing.title}</td>
                <td className="px-4 py-3 text-xs capitalize text-primary-mid">
                  {listing.type.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-xs text-black">{listing.agent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-black">
                  {formatPrice(listing.price, listing.purpose, listing.rental_period)}
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/listings/pending?highlight=${listing.id}`}
                    className="text-xs font-semibold text-primary hover:text-primary-mid"
                  >
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
