"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addMonthlyReportAction } from "@/app/admin/marketing/actions";
import { inputClass } from "./styles";

export function AddMonthlyReportForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [leadsCount, setLeadsCount] = useState("");
  const [spend, setSpend] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!month) {
      setError("Month is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await addMonthlyReportAction(clientId, {
        month,
        leads_count: Number(leadsCount) || 0,
        spend_pkr: Number(spend) || 0,
        report_url: reportUrl,
        notes,
      });
      setMonth("");
      setLeadsCount("");
      setSpend("");
      setReportUrl("");
      setNotes("");
      router.refresh();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add report.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-black">Add monthly report</p>
      {error && <p className="mb-3 text-sm font-medium text-black">⚠ {error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Month</label>
          <input type="date" value={month} onChange={(event) => setMonth(event.target.value)} className={`${inputClass} mt-1`} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Leads Generated</label>
          <input
            value={leadsCount}
            onChange={(event) => setLeadsCount(event.target.value.replace(/\D/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Ad Spend (PKR)</label>
          <input
            value={spend}
            onChange={(event) => setSpend(event.target.value.replace(/\D/g, ""))}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-primary-mid">Report URL (optional)</label>
          <input value={reportUrl} onChange={(event) => setReportUrl(event.target.value)} className={`${inputClass} mt-1`} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-primary-mid">Notes</label>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className={`${inputClass} mt-1`} />
        </div>
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={() => void handleAdd()}
        className="mt-3 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
      >
        {isSaving ? "Adding..." : "Add Report"}
      </button>
    </div>
  );
}
