"use client";

import { useState } from "react";
import { deleteRedirectAction, toggleRedirectAction } from "@/app/admin/seo/actions";
import { AddRedirectForm } from "./AddRedirectForm";

export interface RedirectRow {
  id: string;
  from_path: string;
  to_path: string;
  type: number;
  is_active: boolean;
  hit_count: number;
}

export function RedirectsManager({ initialRedirects }: { initialRedirects: RedirectRow[] }) {
  const [redirects, setRedirects] = useState(initialRedirects);

  return (
    <div className="mt-6">
      <AddRedirectForm onAdded={(redirect) => setRedirects((prev) => [redirect, ...prev])} />

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">From</th>
              <th className="px-4 py-3 text-left font-semibold">To</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Hits</th>
              <th className="px-4 py-3 text-left font-semibold">Active</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((redirect) => (
              <tr key={redirect.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 font-mono text-xs text-black">{redirect.from_path}</td>
                <td className="px-4 py-3 font-mono text-xs text-black">{redirect.to_path}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      redirect.type === 301 ? "bg-primary text-white" : "bg-primary-mid text-white"
                    }`}
                  >
                    {redirect.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{redirect.hit_count}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={redirect.is_active}
                    onChange={(event) => {
                      const isActive = event.target.checked;
                      setRedirects((prev) =>
                        prev.map((row) => (row.id === redirect.id ? { ...row, is_active: isActive } : row)),
                      );
                      void toggleRedirectAction(redirect.id, isActive);
                    }}
                    className="h-4 w-4 accent-secondary"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRedirects((prev) => prev.filter((row) => row.id !== redirect.id));
                      void deleteRedirectAction(redirect.id);
                    }}
                    className="text-xs font-semibold text-primary underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {redirects.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No redirects configured.</p>
        )}
      </div>
    </div>
  );
}
