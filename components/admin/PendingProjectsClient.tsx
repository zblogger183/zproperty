"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { approveProjectAction, rejectProjectAction } from "@/app/admin/projects/actions";
import { inputClass } from "./styles";

export interface PendingProject {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  total_units: number | null;
  cover_image_url: string | null;
  created_at: string;
  city: { name: string } | null;
  area: { name: string } | null;
  developer: { name: string; email: string | null } | null;
}

const REJECT_REASONS = [
  "Incomplete information",
  "Poor quality or no photos",
  "Unverifiable developer",
  "Duplicate project",
  "Prohibited content",
  "Other (add note below)",
];

function PendingProjectCard({ project, onAction }: { project: PendingProject; onAction: () => void }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = [project.area?.name, project.city?.name].filter(Boolean).join(", ");
  const priceRange =
    project.min_price != null
      ? `PKR ${(project.min_price / 100_000).toFixed(0)} Lakh${
          project.max_price != null && project.max_price !== project.min_price
            ? ` – ${(project.max_price / 100_000).toFixed(0)} Lakh`
            : ""
        }`
      : "—";

  async function handleApprove() {
    setIsSubmitting(true);
    setError(null);
    try {
      await approveProjectAction(project.id);
      onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve project.");
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setIsSubmitting(true);
    setError(null);
    try {
      const fullReason = note ? `${reason}. ${note}` : reason;
      await rejectProjectAction(project.id, fullReason);
      onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject project.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary bg-white">
      <div className="flex items-center gap-3 bg-primary px-5 py-3">
        <span className="flex-1 truncate text-sm font-semibold text-white">{project.name}</span>
        <span className="shrink-0 text-xs capitalize text-primary-mid">{project.property_type ?? "—"}</span>
        <span className="ml-auto shrink-0 text-xs text-primary-mid">
          Submitted {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className="flex gap-4 p-5">
        {project.cover_image_url ? (
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-primary">
            <Image src={project.cover_image_url} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-primary-mid text-xs text-white">
            No photo
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-black">{priceRange}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-primary-mid">
            {project.total_units != null && <span>{project.total_units} units</span>}
            {location && <span>{location}</span>}
          </div>
          {project.tagline && <p className="mt-2 line-clamp-2 text-xs text-black">{project.tagline}</p>}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-black">{project.developer?.name ?? "—"}</p>
          <p className="text-xs text-primary-mid">{project.developer?.email ?? ""}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-primary bg-white px-5 py-3">
        <Link
          href={`/admin/projects/${project.id}`}
          className="text-sm text-primary underline hover:text-primary-mid"
        >
          View Full Details →
        </Link>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setIsRejecting((value) => !value)}
          disabled={isSubmitting}
          className="rounded-lg border border-primary bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => void handleApprove()}
          disabled={isSubmitting}
          className="rounded-lg bg-secondary px-6 py-2 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
        >
          {isSubmitting ? "..." : "Approve"}
        </button>
      </div>

      {error && <p className="border-t border-primary px-5 py-2 text-xs font-medium text-black">⚠ {error}</p>}

      {isRejecting && (
        <div className="border-t border-primary bg-white px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-black">Reason for rejection (required):</p>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass}>
            {REJECT_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Additional notes to developer..."
            className={`${inputClass} mt-2`}
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              className="rounded-lg border border-primary bg-white px-4 py-2 text-sm text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? "..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PendingProjectsClient({ initialProjects }: { initialProjects: PendingProject[] }) {
  const [projects, setProjects] = useState(initialProjects);

  if (projects.length === 0) {
    return <p className="py-20 text-center text-base text-primary-mid">All caught up! No projects pending.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {projects.map((project) => (
        <PendingProjectCard
          key={project.id}
          project={project}
          onAction={() => setProjects((prev) => prev.filter((p) => p.id !== project.id))}
        />
      ))}
    </div>
  );
}
