"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateBoostAction } from "@/app/dashboard/boost/actions";

export interface BoostableListing {
  id: string;
  title: string;
  is_featured: boolean;
  is_hot_deal: boolean;
  is_top_search: boolean;
}

export interface BoostPackageOption {
  id: string;
  name: string;
  type: string;
  duration_days: number;
  price: number;
}

const TYPE_LABELS: Record<string, string> = {
  featured: "Featured",
  hot_deal: "Hot Deal",
  top_search: "Top Search",
};

export function BoostPurchaseForm({
  listings,
  packages,
}: {
  listings: BoostableListing[];
  packages: BoostPackageOption[];
}) {
  const router = useRouter();
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [packageId, setPackageId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleActivate() {
    if (!listingId || !packageId) {
      setError("Select a listing and a package.");
      return;
    }
    setIsPending(true);
    setError(null);
    setSuccess(null);

    try {
      await activateBoostAction(listingId, packageId);
      const pkg = packages.find((p) => p.id === packageId);
      setSuccess(`✓ ${pkg?.name ?? "Boost"} activated!`);
      router.refresh();
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : "Failed to activate boost.");
    } finally {
      setIsPending(false);
    }
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-primary bg-white p-5 text-center">
        <p className="text-sm text-primary-mid">
          You don&apos;t have any active listings to boost yet. Boosts only apply to live, active listings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary bg-white p-5">
      <label className="block text-sm font-semibold text-black">Choose a listing</label>
      <select
        value={listingId}
        onChange={(event) => setListingId(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-primary bg-white px-3 py-2.5 text-sm text-black focus:border-2 focus:border-secondary focus:outline-none"
      >
        {listings.map((listing) => (
          <option key={listing.id} value={listing.id}>
            {listing.title}
          </option>
        ))}
      </select>

      <p className="mb-2 mt-5 text-sm font-semibold text-black">Choose a boost package</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {packages.map((pkg) => {
          const selected = packageId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setPackageId(pkg.id)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                selected ? "border-secondary" : "border-primary"
              }`}
            >
              <span className="rounded-full bg-primary-mid px-2 py-0.5 text-[10px] font-bold text-white">
                {TYPE_LABELS[pkg.type] ?? pkg.type}
              </span>
              <p className="mt-2 text-sm font-bold text-black">{pkg.name}</p>
              <p className="text-xs text-primary-mid">{pkg.duration_days} days</p>
              <p className="mt-1 text-lg font-bold text-black">PKR {pkg.price.toLocaleString("en-PK")}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-black">⚠ {error}</p>}
      {success && <p className="mt-4 text-sm font-bold text-primary">{success}</p>}

      <button
        type="button"
        disabled={isPending || !packageId}
        onClick={() => void handleActivate()}
        className="mt-5 w-full rounded-lg bg-secondary py-3 text-sm font-bold text-primary disabled:opacity-60 md:w-auto md:px-8"
      >
        {isPending ? "Activating..." : "Activate Boost"}
      </button>
    </div>
  );
}
