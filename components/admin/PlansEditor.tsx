"use client";

import { useState } from "react";
import { updatePlanAction } from "@/app/admin/settings/plans/actions";
import { inputClass } from "./styles";

export interface PlanRow {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number | null;
  max_listings: number | null;
  max_photos: number | null;
  is_active: boolean;
}

function PlanCard({ plan }: { plan: PlanRow }) {
  const [priceMonthly, setPriceMonthly] = useState(String(plan.price_monthly));
  const [priceAnnual, setPriceAnnual] = useState(plan.price_annual != null ? String(plan.price_annual) : "");
  const [maxListings, setMaxListings] = useState(plan.max_listings != null ? String(plan.max_listings) : "");
  const [maxPhotos, setMaxPhotos] = useState(plan.max_photos != null ? String(plan.max_photos) : "");
  const [isActive, setIsActive] = useState(plan.is_active);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);

    try {
      await updatePlanAction(plan.id, {
        price_monthly: Number(priceMonthly) || 0,
        price_annual: priceAnnual === "" ? null : Number(priceAnnual),
        max_listings: maxListings === "" ? null : Number(maxListings),
        max_photos: maxPhotos === "" ? null : Number(maxPhotos),
        is_active: isActive,
      });
      setSavedMessage(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save plan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold capitalize text-black">{plan.name}</h2>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((value) => !value)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${isActive ? "bg-secondary" : "bg-primary-mid"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              isActive ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Monthly Price (PKR)</label>
          <input
            value={priceMonthly}
            onChange={(event) => setPriceMonthly(event.target.value.replace(/[^\d.]/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Annual Price (PKR)</label>
          <input
            value={priceAnnual}
            onChange={(event) => setPriceAnnual(event.target.value.replace(/[^\d.]/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Max Listings (blank = unlimited)</label>
          <input
            value={maxListings}
            onChange={(event) => setMaxListings(event.target.value.replace(/\D/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Max Photos (blank = unlimited)</label>
          <input
            value={maxPhotos}
            onChange={(event) => setMaxPhotos(event.target.value.replace(/\D/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-black">⚠ {error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-5 py-2 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Plan"}
        </button>
        {savedMessage && <span className="text-sm font-semibold text-primary">✓ Saved</span>}
      </div>
    </div>
  );
}

export function PlansEditor({ plans }: { plans: PlanRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
