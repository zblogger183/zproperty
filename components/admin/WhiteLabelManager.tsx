"use client";

import { useState } from "react";
import { addWhiteLabelClientAction, toggleWhiteLabelActiveAction, type WhiteLabelInput } from "@/app/admin/white-label/actions";
import { inputClass } from "./styles";

export interface WhiteLabelRow {
  id: string;
  domain: string;
  site_title: string | null;
  is_active: boolean;
  custom_domain_verified: boolean;
  monthly_fee_pkr: number | null;
  agency: { name: string } | null;
}

export interface AgencyOption {
  id: string;
  name: string;
}

const EMPTY_FORM: WhiteLabelInput = { agency_id: "", domain: "", site_title: "", monthly_fee_pkr: 0, setup_fee_pkr: 0 };

export function WhiteLabelManager({
  initialClients,
  agencies,
}: {
  initialClients: WhiteLabelRow[];
  agencies: AgencyOption[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [form, setForm] = useState<WhiteLabelInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.agency_id || !form.domain.trim()) {
      setError("Agency and domain are required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const created = await addWhiteLabelClientAction(form);
      const agency = agencies.find((a) => a.id === form.agency_id) ?? null;
      setClients((prev) => [
        {
          id: created.id,
          domain: form.domain,
          site_title: form.site_title,
          is_active: true,
          custom_domain_verified: false,
          monthly_fee_pkr: form.monthly_fee_pkr,
          agency,
        },
        ...prev,
      ]);
      setForm(EMPTY_FORM);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add client.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setClients((prev) => prev.map((client) => (client.id === id ? { ...client, is_active: isActive } : client)));
    await toggleWhiteLabelActiveAction(id, isActive);
  }

  return (
    <div className="mt-6">
      {agencies.length === 0 ? (
        <p className="rounded-xl border border-primary bg-white p-4 text-sm text-primary-mid">
          No agencies exist yet. White-label sites are set up per agency, so add an agency first.
        </p>
      ) : (
        <div className="rounded-xl border border-primary bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-black">Set up a white-label site</p>
          {error && <p className="mb-3 text-sm font-medium text-black">⚠ {error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.agency_id}
              onChange={(event) => setForm((prev) => ({ ...prev, agency_id: event.target.value }))}
              className={inputClass}
            >
              <option value="">Select agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
            <input
              value={form.domain}
              onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
              placeholder="agency.example.com"
              className={inputClass}
            />
            <input
              value={form.site_title}
              onChange={(event) => setForm((prev) => ({ ...prev, site_title: event.target.value }))}
              placeholder="Site title"
              className={inputClass}
            />
            <div className="flex gap-3">
              <input
                value={form.monthly_fee_pkr || ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, monthly_fee_pkr: Number(event.target.value.replace(/\D/g, "")) || 0 }))
                }
                placeholder="Monthly fee (PKR)"
                className={inputClass}
              />
              <input
                value={form.setup_fee_pkr || ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, setup_fee_pkr: Number(event.target.value.replace(/\D/g, "")) || 0 }))
                }
                placeholder="Setup fee (PKR)"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleAdd()}
            className="mt-3 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
          >
            {isSaving ? "Adding..." : "Add Client"}
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Agency</th>
              <th className="px-4 py-3 text-left font-semibold">Domain</th>
              <th className="px-4 py-3 text-left font-semibold">Monthly Fee</th>
              <th className="px-4 py-3 text-left font-semibold">Domain Verified</th>
              <th className="px-4 py-3 text-left font-semibold">Active</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 text-sm font-semibold text-black">{client.agency?.name ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-black">{client.domain}</td>
                <td className="px-4 py-3 text-sm text-black">
                  {client.monthly_fee_pkr ? `PKR ${Number(client.monthly_fee_pkr).toLocaleString("en-PK")}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {client.custom_domain_verified ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">✓ Verified</span>
                  ) : (
                    <span className="text-xs text-primary-mid">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={client.is_active}
                    onChange={(event) => void handleToggle(client.id, event.target.checked)}
                    className="h-4 w-4 accent-secondary"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No white-label sites configured yet.</p>
        )}
      </div>
    </div>
  );
}
