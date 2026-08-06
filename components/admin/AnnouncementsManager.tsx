"use client";

import { useState } from "react";
import { saveAnnouncementsAction, type AnnouncementInput } from "@/app/admin/content/announcements/actions";
import { inputClass } from "./styles";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function AnnouncementsManager({ initial }: { initial: AnnouncementInput[] }) {
  const [items, setItems] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<AnnouncementInput>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: newId(), message: "", link: "", is_active: false }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);
    try {
      await saveAnnouncementsAction(items);
      setSavedMessage(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save announcements.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {error && <p className="mb-4 text-sm font-medium text-black">⚠ {error}</p>}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-primary bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-primary-mid">Message</label>
                <input
                  value={item.message}
                  onChange={(event) => updateItem(item.id, { message: event.target.value })}
                  className={`${inputClass} mt-1`}
                />
                <label className="mt-2 block text-xs font-semibold text-primary-mid">Link (optional)</label>
                <input
                  value={item.link}
                  onChange={(event) => updateItem(item.id, { link: event.target.value })}
                  placeholder="/listing/... or https://..."
                  className={`${inputClass} mt-1`}
                />
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.is_active}
                onClick={() => updateItem(item.id, { is_active: !item.is_active })}
                className={`relative mt-5 h-6 w-11 shrink-0 rounded-full transition ${
                  item.is_active ? "bg-secondary" : "bg-primary-mid"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    item.is_active ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="mt-2 text-xs font-semibold text-primary underline"
            >
              Remove
            </button>
          </div>
        ))}

        {items.length === 0 && <p className="text-sm text-primary-mid">No announcement banners yet.</p>}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary"
        >
          + Add Announcement
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        {savedMessage && <span className="text-sm font-semibold text-primary">✓ Saved</span>}
      </div>
    </div>
  );
}
