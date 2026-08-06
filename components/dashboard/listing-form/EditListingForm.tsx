"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Step1Type } from "./Step1Type";
import { Step2Location } from "./Step2Location";
import { Step3Details } from "./Step3Details";
import { Step5Description } from "./Step5Description";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { editListingSchema, type EditListingInput } from "@/app/dashboard/listings/[id]/schemas";
import {
  updateListingAction,
  resubmitFromEditAction,
  deleteListingImageAction,
} from "@/app/dashboard/listings/[id]/actions";
import type { UploadedImage } from "@/types";

export interface EditableListing extends EditListingInput {
  id: string;
  status: string;
  reject_reason: string | null;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary font-bold",
  pending: "bg-primary text-white",
  paused: "bg-primary-mid text-white",
  rejected: "border border-primary bg-white text-black",
  expired: "border border-primary bg-white text-primary-mid",
  sold: "bg-primary text-secondary",
};

const DEFAULT_FEATURES: EditListingInput["features"] = {
  electricity: false,
  gas: false,
  water: false,
  security: false,
  backup_generator: false,
  swimming_pool: false,
  gym: false,
  mosque: false,
  park: false,
  cctv: false,
  internet: false,
  servant_quarters: false,
};

export function EditListingForm({
  listing,
  initialImages,
}: {
  listing: EditableListing;
  initialImages: UploadedImage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<Partial<EditListingInput>>(() => ({
    purpose: listing.purpose,
    type: listing.type,
    city_id: listing.city_id,
    area_id: listing.area_id,
    society_id: listing.society_id,
    address: listing.address,
    lat: listing.lat,
    lng: listing.lng,
    price: listing.price,
    is_negotiable: listing.is_negotiable,
    area_sqft: listing.area_sqft,
    area_marla: listing.area_marla,
    beds: listing.beds,
    baths: listing.baths,
    floors: listing.floors,
    floor_number: listing.floor_number,
    parking_spaces: listing.parking_spaces,
    age_years: listing.age_years,
    furnished_status: listing.furnished_status,
    features: listing.features ?? DEFAULT_FEATURES,
    title: listing.title,
    description: listing.description,
    video_url: listing.video_url,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedImage[]>(initialImages);

  // Render-time reset (same pattern as Step2Location.tsx/Step5Description.tsx):
  // router.refresh() re-runs the server page fetch and passes a new
  // initialImages array down — this resyncs our local copy after a photo is
  // added or removed instead of relying on stale first-render props. It's
  // derived state, not a fetch, so it belongs at render time rather than in
  // an effect.
  const [prevInitialImages, setPrevInitialImages] = useState(initialImages);
  if (initialImages !== prevInitialImages) {
    setPrevInitialImages(initialImages);
    setPhotos(initialImages);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function updateData(patch: Partial<EditListingInput>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function handleSave() {
    const result = editListingSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setFormError("Please fix the errors above before saving.");
      return;
    }

    setErrors({});
    setFormError(null);

    startTransition(async () => {
      try {
        if (listing.status === "rejected") {
          await resubmitFromEditAction(listing.id, result.data);
          setToast("✓ Changes saved and resubmitted for review.");
        } else {
          await updateListingAction(listing.id, result.data);
          setToast("✓ Changes saved.");
        }
        router.refresh();
      } catch (actionError) {
        setFormError(actionError instanceof Error ? actionError.message : "Failed to save changes.");
      }
    });
  }

  function handleDeletePhoto(imageId: string | undefined) {
    if (!imageId) return;
    if (!window.confirm("Remove this photo?")) return;

    startTransition(async () => {
      try {
        await deleteListingImageAction(listing.id, imageId);
        setPhotos((prev) => prev.filter((photo) => photo.id !== imageId));
        router.refresh();
      } catch (actionError) {
        setFormError(actionError instanceof Error ? actionError.message : "Failed to remove photo.");
      }
    });
  }

  const isLocked = listing.status === "sold" || listing.status === "expired";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/listings" className="text-sm text-primary hover:underline">
          ← Back to My Listings
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-black">Edit Listing</h1>
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs capitalize ${
              STATUS_BADGE_CLASSES[listing.status] ?? ""
            }`}
          >
            {listing.status}
          </span>
        </div>
        {listing.status === "rejected" && listing.reject_reason && (
          <p className="mt-2 rounded-lg border border-primary bg-white p-3 text-sm text-black">
            <span className="font-semibold">Reason for rejection:</span> {listing.reject_reason}
          </p>
        )}
      </div>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-black">Basic Info</h2>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-black">Listing Title</label>
          <input
            value={data.title ?? ""}
            onChange={(event) => updateData({ title: event.target.value })}
            className="w-full rounded-lg border border-primary bg-white px-3 py-2.5 text-sm text-black placeholder:text-primary-mid focus:border-2 focus:border-secondary focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs font-medium text-black">⚠ {errors.title}</p>}
        </div>
        <Step1Type data={data} errors={errors} onChange={updateData} />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-black">Location</h2>
        <Step2Location data={data} errors={errors} onChange={updateData} />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-black">Property Details</h2>
        <Step3Details data={data} errors={errors} propertyType={data.type} onChange={updateData} />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-black">Description</h2>
        <Step5Description
          data={data}
          errors={errors}
          context={{ step1: data, step2: data, step3: data }}
          onChange={updateData}
        />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-black">Current Photos</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-primary-mid">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
            {photos.map((photo) => (
              <div
                key={photo.id ?? photo.thumb_url}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                  photo.is_primary ? "border-secondary" : "border-primary"
                }`}
              >
                <Image src={photo.thumb_url} alt={photo.alt_text || ""} fill className="object-cover" />
                {photo.is_primary && (
                  <span className="absolute left-1 top-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  disabled={isPending}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          {/* key={photos.length} forces ImageUploader to remount (and reset
              its own internal, uncontrolled image list) whenever the photo
              count changes. Unlike the new-listing wizard, uploads here pass
              listingId so /api/upload/image writes straight into
              listing_images — remounting keeps ImageUploader's own transient
              grid from duplicating what the "Current Photos" grid above
              already shows once router.refresh() pulls the new row in. */}
          <ImageUploader
            key={photos.length}
            listingId={listing.id}
            maxFiles={Math.max(1, 20 - photos.length)}
            onUploaded={() => router.refresh()}
          />
        </div>
      </section>

      <div className="flex items-center gap-4">
        {isLocked ? (
          <p className="rounded-xl border border-primary bg-white p-4 text-sm text-primary-mid">
            This listing is {listing.status} and can no longer be edited.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-secondary px-6 py-3 text-sm font-bold text-primary hover:bg-secondary-dark disabled:opacity-50"
            >
              {isPending ? "Saving..." : listing.status === "rejected" ? "Save & Resubmit for Review" : "Save Changes"}
            </button>
            {formError && <p className="text-sm font-medium text-black">⚠ {formError}</p>}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
