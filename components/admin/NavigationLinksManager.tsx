"use client";

import { useState } from "react";
import { saveNavigationLinksAction, type NavLinkInput } from "@/app/admin/content/navigation/actions";
import { inputClass } from "./styles";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function NavigationLinksManager({ initial }: { initial: NavLinkInput[] }) {
  const [links, setLinks] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLink(id: string, patch: Partial<NavLinkInput>) {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...patch } : link)));
  }

  function addLink() {
    setLinks((prev) => [...prev, { id: newId(), label: "", href: "" }]);
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);
    try {
      await saveNavigationLinksAction(links);
      setSavedMessage(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save navigation.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {error && <p className="mb-4 text-sm font-medium text-black">⚠ {error}</p>}

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="w-16 px-4 py-3 text-left font-semibold">Order</th>
              <th className="px-4 py-3 text-left font-semibold">Label</th>
              <th className="px-4 py-3 text-left font-semibold">URL</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, index) => (
              <tr key={link.id} className="border-b border-primary">
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveLink(index, -1)}
                      className="text-primary disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === links.length - 1}
                      onClick={() => moveLink(index, 1)}
                      className="text-primary disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={link.label}
                    onChange={(event) => updateLink(link.id, { label: event.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={link.href}
                    onChange={(event) => updateLink(link.id, { href: event.target.value })}
                    placeholder="/buy/lahore"
                    className={inputClass}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="text-xs font-semibold text-primary underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {links.length === 0 && <p className="py-8 text-center text-sm text-primary-mid">No navigation links yet.</p>}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addLink}
          className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary"
        >
          + Add Link
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
