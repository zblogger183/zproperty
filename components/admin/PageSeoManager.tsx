"use client";

import { useState } from "react";
import { upsertPageSeoAction, deletePageSeoAction, type PageSeoInput } from "@/app/admin/seo/actions";
import { inputClass } from "./styles";

export interface PageSeoRow {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  robots: string | null;
  canonical: string | null;
}

const EMPTY_FORM: PageSeoInput = { path: "", title: "", description: "", og_image: "", robots: "", canonical: "" };

export function PageSeoManager({ initialRows }: { initialRows: PageSeoRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<PageSeoInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(row: PageSeoRow) {
    setEditingId(row.id);
    setForm({
      path: row.path,
      title: row.title ?? "",
      description: row.description ?? "",
      og_image: row.og_image ?? "",
      robots: row.robots ?? "",
      canonical: row.canonical ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.path.trim() || !form.title.trim()) {
      setError("Path and title are required.");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const saved = await upsertPageSeoAction(form);
      setRows((prev) => {
        const exists = prev.some((row) => row.id === saved.id);
        return exists ? prev.map((row) => (row.id === saved.id ? saved : row)) : [saved, ...prev];
      });
      cancelEdit();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
    await deletePageSeoAction(id);
    if (editingId === id) cancelEdit();
  }

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-primary bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-black">
          {editingId ? `Editing: ${form.path}` : "Add a page SEO override"}
        </p>

        {error && <p className="mb-3 text-sm font-medium text-black">⚠ {error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary-mid">Path</label>
            <input
              value={form.path}
              onChange={(event) => setForm((prev) => ({ ...prev, path: event.target.value }))}
              placeholder="/buy/lahore"
              disabled={!!editingId}
              className={`${inputClass} mt-1 disabled:opacity-60`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid">Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-primary-mid">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={2}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid">Robots</label>
            <input
              value={form.robots}
              onChange={(event) => setForm((prev) => ({ ...prev, robots: event.target.value }))}
              placeholder="index, follow"
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid">Canonical URL</label>
            <input
              value={form.canonical}
              onChange={(event) => setForm((prev) => ({ ...prev, canonical: event.target.value }))}
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSave()}
            className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
          >
            {isSaving ? "Saving..." : editingId ? "Save Changes" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-primary bg-white px-4 py-2.5 text-sm text-primary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Path</th>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 font-mono text-xs text-black">{row.path}</td>
                <td className="max-w-[220px] truncate px-4 py-3 text-xs text-black">{row.title}</td>
                <td className="max-w-[280px] truncate px-4 py-3 text-xs text-primary-mid">{row.description}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button type="button" onClick={() => startEdit(row)} className="font-semibold text-primary underline">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      className="font-semibold text-primary underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No page SEO overrides configured.</p>
        )}
      </div>
    </div>
  );
}
