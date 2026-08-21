"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction, type ProjectUnitTypeInput } from "@/app/admin/projects/actions";
import { Step2Location } from "@/components/dashboard/listing-form/Step2Location";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { inputClass, labelClass, errorClass } from "./styles";

export interface DeveloperOption {
  id: string;
  name: string;
  company_name: string | null;
}

// type/property_type/status are all DB check-constrained (confirmed against
// the live schema, not guessed) — these option lists must match exactly or
// the insert is rejected.
const TYPE_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed", label: "Mixed" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "flats", label: "Flats / Apartments" },
  { value: "houses", label: "Houses" },
  { value: "plots", label: "Plots" },
  { value: "shops", label: "Shops" },
  { value: "offices", label: "Offices" },
  { value: "mixed", label: "Mixed" },
];

const STATUS_OPTIONS = [
  { value: "pre_launch", label: "Pre-Launch" },
  { value: "launching", label: "Launching" },
  { value: "under_construction", label: "Under Construction" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
];

interface LocationState {
  city_id?: string;
  area_id?: string;
  society_id?: string | null;
  address?: string;
  lat?: number | null;
  lng?: number | null;
}

interface UnitTypeRow extends ProjectUnitTypeInput {
  key: string;
}

interface UploadedGalleryImage {
  url: string;
  thumb_url: string | null;
}

function emptyUnitType(): UnitTypeRow {
  return { key: crypto.randomUUID(), unit_type: "" };
}

export function ProjectCreateForm({ developers }: { developers: DeveloperOption[] }) {
  const router = useRouter();

  const [developerId, setDeveloperId] = useState("");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [type, setType] = useState("residential");
  const [propertyType, setPropertyType] = useState("flats");
  const [status, setStatus] = useState("under_construction");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LocationState>({});
  const [launchDate, setLaunchDate] = useState("");
  const [possessionDate, setPossessionDate] = useState("");
  const [completionPct, setCompletionPct] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [images, setImages] = useState<UploadedGalleryImage[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const [brochureError, setBrochureError] = useState<string | null>(null);
  const [unitTypes, setUnitTypes] = useState<UnitTypeRow[]>([emptyUnitType()]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  function updateUnitType(key: string, field: keyof ProjectUnitTypeInput, value: string) {
    setUnitTypes((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const isNumeric = field !== "unit_type" && field !== "notes";
        return { ...row, [field]: isNumeric ? (value === "" ? null : Number(value)) : value };
      }),
    );
  }

  async function handleBrochureFile(file: File) {
    setIsUploadingBrochure(true);
    setBrochureError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "projects");

      const response = await fetch("/api/upload/pdf", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed.");
      }
      setBrochureUrl(result.url);
    } catch (uploadError) {
      setBrochureError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploadingBrochure(false);
    }
  }

  async function handleSave() {
    setError(null);

    if (!name.trim()) return setError("Project name is required.");
    if (!developerId) return setError("Select a developer.");
    if (!location.city_id) return setError("Select a city.");

    setIsSaving(true);
    try {
      const result = await createProjectAction({
        developer_id: developerId,
        name,
        tagline,
        type,
        property_type: propertyType,
        city_id: location.city_id,
        area_id: location.area_id ?? null,
        society_id: location.society_id ?? null,
        address: location.address,
        lat: location.lat ?? null,
        lng: location.lng ?? null,
        description,
        amenities: amenitiesText.split("\n").map((line) => line.trim()).filter(Boolean),
        status,
        launch_date: launchDate || null,
        possession_date: possessionDate || null,
        completion_pct: completionPct ? Number(completionPct) : null,
        total_units: totalUnits ? Number(totalUnits) : null,
        min_price: minPrice ? Number(minPrice) : null,
        max_price: maxPrice ? Number(maxPrice) : null,
        min_area: minArea ? Number(minArea) : null,
        max_area: maxArea ? Number(maxArea) : null,
        video_url: videoUrl,
        virtual_tour_url: virtualTourUrl,
        brochure_url: brochureUrl || null,
        images,
        unit_types: unitTypes,
      });
      router.push(`/admin/projects/${result.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create project.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6 pb-16">
      {error && (
        <p className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Developer</h2>
        <p className="mt-1 text-xs text-primary-mid">
          The account this project belongs to — its contact number on the public page comes from here.
        </p>
        <select value={developerId} onChange={(event) => setDeveloperId(event.target.value)} className={`${inputClass} mt-3`}>
          <option value="">Select developer</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.company_name ? `${developer.company_name} (${developer.name})` : developer.name}
            </option>
          ))}
        </select>
        {developers.length === 0 && (
          <p className="mt-2 text-xs text-primary-mid">
            No developer accounts yet — register one first (role: developer) before creating their project.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Basic Info</h2>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Project Name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="e.g. Skyline Heights" />
          </div>
          <div>
            <label className={labelClass}>Tagline (optional)</label>
            <input value={tagline} onChange={(event) => setTagline(event.target.value)} className={inputClass} placeholder="e.g. Luxury living in the heart of the city" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Property Type</label>
              <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className={inputClass}>
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Construction Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className={inputClass} placeholder="What's this project about?" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-black">Location</h2>
        <Step2Location
          data={location}
          errors={{}}
          onChange={(update) => setLocation((prev) => ({ ...prev, ...update }))}
        />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Timeline &amp; Scale</h2>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Launch Date</label>
            <input type="date" value={launchDate} onChange={(event) => setLaunchDate(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Possession Date</label>
            <input type="date" value={possessionDate} onChange={(event) => setPossessionDate(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Completion %</label>
            <input type="number" min="0" max="100" value={completionPct} onChange={(event) => setCompletionPct(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total Units</label>
            <input type="number" min="0" value={totalUnits} onChange={(event) => setTotalUnits(event.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Price &amp; Area Range</h2>
        <p className="mt-1 text-xs text-primary-mid">Shown on listing cards — the full breakdown per unit type goes below.</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Min Price (PKR)</label>
            <input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max Price (PKR)</label>
            <input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Min Area (sqft)</label>
            <input type="number" value={minArea} onChange={(event) => setMinArea(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max Area (sqft)</label>
            <input type="number" value={maxArea} onChange={(event) => setMaxArea(event.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Amenities</h2>
        <p className="mt-1 text-xs text-primary-mid">One per line.</p>
        <textarea value={amenitiesText} onChange={(event) => setAmenitiesText(event.target.value)} rows={4} className={`${inputClass} mt-2`} placeholder={"Swimming Pool\nGym\n24/7 Security"} />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Photos</h2>
        <p className="mt-1 text-xs text-primary-mid">First photo becomes the cover image.</p>
        <div className="mt-3">
          <ImageUploader folder="projects" maxFiles={20} onUploaded={(uploaded) => setImages(uploaded.map((image) => ({ url: image.large_url, thumb_url: image.thumb_url })))} />
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Brochure / Master Plan</h2>
        <input
          ref={brochureInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleBrochureFile(file);
            event.target.value = "";
          }}
        />
        {brochureUrl ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-secondary bg-white p-3">
            <span className="text-sm font-semibold text-black">✓ PDF uploaded</span>
            <a href={brochureUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>
            <button type="button" disabled={isUploadingBrochure} onClick={() => brochureInputRef.current?.click()} className="ml-auto cursor-pointer text-xs text-primary-mid underline disabled:opacity-60">
              {isUploadingBrochure ? "Uploading..." : "Replace"}
            </button>
            <button type="button" onClick={() => setBrochureUrl("")} className="cursor-pointer text-xs text-primary-mid underline">Remove</button>
          </div>
        ) : (
          <button type="button" disabled={isUploadingBrochure} onClick={() => brochureInputRef.current?.click()} className="mt-3 w-full cursor-pointer rounded-lg border-2 border-dashed border-primary p-4 text-center text-sm font-semibold text-black disabled:opacity-60">
            {isUploadingBrochure ? "Uploading..." : "Upload Brochure PDF"}
          </button>
        )}
        {brochureError && <p className={errorClass}>⚠ {brochureError}</p>}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Video URL (optional)</label>
            <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className={inputClass} placeholder="YouTube link" />
          </div>
          <div>
            <label className={labelClass}>Virtual Tour URL (optional)</label>
            <input value={virtualTourUrl} onChange={(event) => setVirtualTourUrl(event.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Unit Types &amp; Payment Plans</h2>
        <p className="mt-1 text-xs text-primary-mid">Studio, 1 Bed, 2 Bed, Penthouse, Commercial — one card per unit type, each with its own price and payment terms.</p>

        <div className="mt-4 flex flex-col gap-4">
          {unitTypes.map((row, index) => (
            <div key={row.key} className="rounded-lg border border-primary p-4">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Unit Type Name</label>
                {unitTypes.length > 1 && (
                  <button type="button" onClick={() => setUnitTypes((prev) => prev.filter((r) => r.key !== row.key))} className="text-xs text-primary-mid underline">
                    Remove
                  </button>
                )}
              </div>
              <input value={row.unit_type} onChange={(event) => updateUnitType(row.key, "unit_type", event.target.value)} className={inputClass} placeholder="e.g. 2 Bedroom" />

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Total Price (PKR)</label>
                  <input type="number" value={row.total_price ?? ""} onChange={(event) => updateUnitType(row.key, "total_price", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Advance %</label>
                  <input type="number" value={row.advance_pct ?? ""} onChange={(event) => updateUnitType(row.key, "advance_pct", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Advance Amount</label>
                  <input type="number" value={row.advance_amount ?? ""} onChange={(event) => updateUnitType(row.key, "advance_amount", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Installment Years</label>
                  <input type="number" value={row.installment_yrs ?? ""} onChange={(event) => updateUnitType(row.key, "installment_yrs", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Monthly Installment</label>
                  <input type="number" value={row.monthly_installment ?? ""} onChange={(event) => updateUnitType(row.key, "monthly_installment", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>On Possession %</label>
                  <input type="number" value={row.on_possession_pct ?? ""} onChange={(event) => updateUnitType(row.key, "on_possession_pct", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>On Possession Amount</label>
                  <input type="number" value={row.on_possession_amt ?? ""} onChange={(event) => updateUnitType(row.key, "on_possession_amt", event.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelClass}>Notes (optional)</label>
                <input value={row.notes ?? ""} onChange={(event) => updateUnitType(row.key, "notes", event.target.value)} className={inputClass} />
              </div>
              {index === unitTypes.length - 1 && (
                <button
                  type="button"
                  onClick={() => setUnitTypes((prev) => [...prev, emptyUnitType()])}
                  className="mt-3 text-xs font-semibold text-primary underline"
                >
                  + Add another unit type
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-primary bg-white py-4">
        <button type="button" disabled={isSaving} onClick={() => void handleSave()} className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60">
          {isSaving ? "Creating..." : "Create & Publish Project"}
        </button>
      </div>
    </div>
  );
}
