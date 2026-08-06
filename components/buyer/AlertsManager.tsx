"use client";

import { useState } from "react";
import { createAlertAction, deleteAlertAction, toggleAlertActiveAction, type AlertInput } from "@/app/buyer/actions";

export interface AlertRow {
  id: string;
  name: string;
  purpose: string;
  min_price: number | null;
  max_price: number | null;
  frequency: string;
  is_active: boolean;
  city: { name: string } | null;
}

export interface CityOption {
  id: string;
  name: string;
}

const inputClass =
  "w-full border border-primary rounded-lg px-3 py-2.5 text-sm text-black bg-white placeholder:text-primary-mid focus:outline-none focus:border-secondary focus:border-2";

const EMPTY_FORM: AlertInput = { name: "", purpose: "buy", city_id: "", min_price: null, max_price: null, frequency: "daily" };

export function AlertsManager({ initialAlerts, cities }: { initialAlerts: AlertRow[]; cities: CityOption[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [form, setForm] = useState<AlertInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.name.trim()) {
      setError("Give this alert a name.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await createAlertAction(form);
      const city = cities.find((c) => c.id === form.city_id) ?? null;
      setAlerts((prev) => [
        { id: crypto.randomUUID(), ...form, is_active: true, city },
        ...prev,
      ]);
      setForm(EMPTY_FORM);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create alert.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, is_active: isActive } : alert)));
    await toggleAlertActiveAction(id, isActive);
  }

  async function handleDelete(id: string) {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    await deleteAlertAction(id);
  }

  return (
    <div>
      <div className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Create an alert</h2>
        {error && <p className="mt-2 text-sm font-medium text-black">⚠ {error}</p>}

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. 3 bed flats in DHA Lahore"
            className={`${inputClass} sm:col-span-2`}
          />
          <select
            value={form.purpose}
            onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value as "buy" | "rent" }))}
            className={inputClass}
          >
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
          </select>
          <select
            value={form.city_id}
            onChange={(event) => setForm((prev) => ({ ...prev, city_id: event.target.value }))}
            className={inputClass}
          >
            <option value="">Any city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <input
            value={form.min_price ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, min_price: event.target.value ? Number(event.target.value.replace(/\D/g, "")) : null }))
            }
            placeholder="Min price (PKR)"
            className={inputClass}
          />
          <input
            value={form.max_price ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, max_price: event.target.value ? Number(event.target.value.replace(/\D/g, "")) : null }))
            }
            placeholder="Max price (PKR)"
            className={inputClass}
          />
          <select
            value={form.frequency}
            onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value as AlertInput["frequency"] }))}
            className={`${inputClass} sm:col-span-2`}
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleCreate()}
          className="mt-4 rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Creating..." : "Create Alert"}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center gap-4 rounded-xl border border-primary bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black">{alert.name}</p>
              <p className="mt-0.5 text-xs capitalize text-primary-mid">
                {alert.purpose} · {alert.city?.name ?? "Any city"}
                {alert.min_price || alert.max_price
                  ? ` · PKR ${alert.min_price?.toLocaleString("en-PK") ?? "0"} – ${
                      alert.max_price?.toLocaleString("en-PK") ?? "∞"
                    }`
                  : ""}{" "}
                · {alert.frequency}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={alert.is_active}
              onClick={() => void handleToggle(alert.id, !alert.is_active)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                alert.is_active ? "bg-secondary" : "bg-primary-mid"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  alert.is_active ? "left-5" : "left-0.5"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(alert.id)}
              className="shrink-0 text-xs font-semibold text-primary underline"
            >
              Delete
            </button>
          </div>
        ))}

        {alerts.length === 0 && (
          <p className="rounded-xl border border-primary bg-white p-8 text-center text-sm text-primary-mid">
            No alerts yet. Create one above to get notified about new matching listings.
          </p>
        )}
      </div>
    </div>
  );
}
