"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Step6Data } from "@/app/dashboard/listings/schemas";
import type { AllFormData } from "./types";
import { TYPE_LABELS } from "./styles";
import { SEOPanel } from "./SEOPanel";

export function Step6Review({
  formData,
  errors,
  onChangeSeo,
}: {
  formData: AllFormData;
  errors: Record<string, string>;
  onChangeSeo: (data: Partial<Step6Data>) => void;
}) {
  const { step1, step2, step3, step4, step5, step6 } = formData;
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Render-time reset (see Step2Location.tsx for the same pattern) —
  // clearing the stale label when the city disappears is derived state,
  // not a fetch.
  const [prevCityId, setPrevCityId] = useState(step2.city_id);
  if (step2.city_id !== prevCityId) {
    setPrevCityId(step2.city_id);
    if (!step2.city_id && locationLabel !== null) setLocationLabel(null);
  }

  useEffect(() => {
    if (!step2.city_id) return;

    const supabase = createClient();
    let active = true;

    Promise.all([
      supabase.from("cities").select("name").eq("id", step2.city_id).single(),
      step2.area_id
        ? supabase.from("areas").select("name").eq("id", step2.area_id).single()
        : Promise.resolve({ data: null }),
    ]).then(([cityResult, areaResult]) => {
      if (!active) return;
      const cityName = (cityResult.data?.name as string | undefined) ?? null;
      const areaName = (areaResult.data?.name as string | undefined) ?? null;
      setLocationLabel([areaName, cityName].filter(Boolean).join(", ") || null);
    });

    return () => {
      active = false;
    };
  }, [step2.city_id, step2.area_id]);

  const firstImage = step4.images?.[0];
  const plainDescription = (step5.description ?? "").replace(/<[^>]*>/g, "");

  const autoTitle = step5.title ? `${step5.title} | ZProperty.pk` : "ZProperty.pk";
  const autoDesc = plainDescription.slice(0, 160);

  return (
    <div>
      <div className="rounded-xl border border-primary bg-white p-5">
        <div className="flex items-center gap-2">
          <span
            className={
              step1.purpose === "buy"
                ? "rounded-full bg-primary px-2 py-1 text-xs text-white"
                : "rounded-full border border-primary px-2 py-1 text-xs text-primary"
            }
          >
            {step1.purpose === "buy" ? "For Sale" : "For Rent"}
          </span>
          {step1.type && <span className="text-sm text-primary-mid">{TYPE_LABELS[step1.type]}</span>}
        </div>

        <p className="mt-2 text-2xl font-bold text-black">
          {step3.price != null ? `PKR ${step3.price.toLocaleString("en-US")}` : "—"}
        </p>

        {locationLabel && <p className="mt-1 text-sm text-primary-mid">{locationLabel}</p>}

        <div className="mt-2 flex flex-wrap gap-3 text-sm text-black">
          {step3.beds != null && <span>{step3.beds} Beds</span>}
          {step3.baths != null && <span>{step3.baths} Baths</span>}
          {step3.area_marla != null && <span>{step3.area_marla} Marla</span>}
        </div>

        {firstImage && (
          <div className="relative mt-3 h-[60px] w-20 overflow-hidden rounded-lg border border-primary">
            <Image src={firstImage.thumb_url} alt="" fill className="object-cover" />
          </div>
        )}

        <div className="mt-3 inline-block rounded-lg bg-primary px-3 py-1.5 text-xs text-white">
          Your listing will be reviewed by our team before going live. This usually takes less than 24
          hours.
        </div>
      </div>

      <SEOPanel
        data={step6}
        errors={errors}
        slugPreview={slugify(step5.title ?? "")}
        autoTitle={autoTitle}
        autoDesc={autoDesc}
        onChange={onChangeSeo}
      />
    </div>
  );
}
