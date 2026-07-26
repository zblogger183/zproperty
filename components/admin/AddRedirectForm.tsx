"use client";

import { useState } from "react";
import { addRedirectAction } from "@/app/admin/seo/actions";
import { inputClass } from "@/components/admin/styles";
import type { RedirectRow } from "./RedirectsManager";

export function AddRedirectForm({ onAdded }: { onAdded: (redirect: RedirectRow) => void }) {
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [type, setType] = useState<301 | 302>(301);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!fromPath.trim() || !toPath.trim()) {
      setError("Both From and To paths are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const redirect = await addRedirectAction(fromPath.trim(), toPath.trim(), type);
      onAdded(redirect);
      setFromPath("");
      setToPath("");
      setType(301);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add redirect.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary bg-white p-4">
      {error && (
        <p className="mb-3 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1">
          <label className="block text-xs font-semibold text-primary-mid" htmlFor="fromPath">
            From path
          </label>
          <input
            id="fromPath"
            value={fromPath}
            onChange={(event) => setFromPath(event.target.value)}
            placeholder="/old-page"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="block text-xs font-semibold text-primary-mid" htmlFor="toPath">
            To path
          </label>
          <input
            id="toPath"
            value={toPath}
            onChange={(event) => setToPath(event.target.value)}
            placeholder="/new-page"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(event) => setType(Number(event.target.value) as 301 | 302)}
            className={`${inputClass} mt-1`}
          >
            <option value={301}>301 (Permanent)</option>
            <option value={302}>302 (Temporary)</option>
          </select>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleAdd()}
          className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
