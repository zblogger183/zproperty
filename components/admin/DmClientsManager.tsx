"use client";

import { useState } from "react";
import Link from "next/link";
import { addDmClientAction, updateDmClientStatusAction, type DmClientInput } from "@/app/admin/marketing/actions";
import { inputClass } from "./styles";

export interface DmClientRow {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  package_name: string | null;
  monthly_fee: number | null;
  status: string;
}

const EMPTY_FORM: DmClientInput = {
  business_name: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  service_type: "",
  package_name: "",
  monthly_fee: 0,
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary",
  paused: "bg-primary-mid text-white",
  cancelled: "border border-primary bg-white text-black",
};

export function DmClientsManager({ initialClients }: { initialClients: DmClientRow[] }) {
  const [clients, setClients] = useState(initialClients);
  const [form, setForm] = useState<DmClientInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.business_name.trim()) {
      setError("Business name is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const created = await addDmClientAction(form);
      setClients((prev) => [{ id: created.id, status: "active", ...form }, ...prev]);
      setForm(EMPTY_FORM);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add client.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(clientId: string, status: string) {
    setClients((prev) => prev.map((client) => (client.id === clientId ? { ...client, status } : client)));
    await updateDmClientStatusAction(clientId, status as "active" | "paused" | "cancelled");
  }

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-primary bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-black">Add a marketing client</p>
        {error && <p className="mb-3 text-sm font-medium text-black">⚠ {error}</p>}

        <div className="grid grid-cols-3 gap-3">
          <input
            value={form.business_name}
            onChange={(event) => setForm((prev) => ({ ...prev, business_name: event.target.value }))}
            placeholder="Business name"
            className={inputClass}
          />
          <input
            value={form.contact_name}
            onChange={(event) => setForm((prev) => ({ ...prev, contact_name: event.target.value }))}
            placeholder="Contact name"
            className={inputClass}
          />
          <input
            value={form.contact_phone}
            onChange={(event) => setForm((prev) => ({ ...prev, contact_phone: event.target.value }))}
            placeholder="Contact phone"
            className={inputClass}
          />
          <input
            value={form.contact_email}
            onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))}
            placeholder="Contact email"
            className={inputClass}
          />
          <input
            value={form.package_name}
            onChange={(event) => setForm((prev) => ({ ...prev, package_name: event.target.value }))}
            placeholder="Package (e.g. Growth)"
            className={inputClass}
          />
          <input
            value={form.monthly_fee || ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, monthly_fee: Number(event.target.value.replace(/\D/g, "")) || 0 }))
            }
            placeholder="Monthly fee (PKR)"
            className={inputClass}
          />
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

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Business</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">Package</th>
              <th className="px-4 py-3 text-left font-semibold">Monthly Fee</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 text-sm font-semibold text-black">
                  <Link href={`/admin/marketing/${client.id}`} className="hover:underline">
                    {client.business_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {client.contact_name}
                  {client.contact_phone ? ` · ${client.contact_phone}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{client.package_name ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-black">
                  {client.monthly_fee ? `PKR ${Number(client.monthly_fee).toLocaleString("en-PK")}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={client.status}
                    onChange={(event) => void handleStatusChange(client.id, event.target.value)}
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
                      STATUS_BADGE_CLASSES[client.status] ?? ""
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/marketing/${client.id}`} className="text-xs font-semibold text-primary underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No marketing clients yet.</p>
        )}
      </div>
    </div>
  );
}
