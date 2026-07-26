"use client";

import { useState } from "react";
import Link from "next/link";
import { updateLeadStatusAction } from "@/app/dashboard/leads/actions";
import { KanbanCard, type KanbanLead } from "./KanbanCard";

const COLUMNS = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "viewing", label: "Viewing" },
  { id: "negotiating", label: "Negotiating" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

export interface Pipeline {
  new: KanbanLead[];
  contacted: KanbanLead[];
  viewing: KanbanLead[];
  negotiating: KanbanLead[];
}

export function KanbanBoard({
  initialPipeline,
  wonCount,
  lostCount,
}: {
  initialPipeline: Pipeline;
  wonCount: number;
  lostCount: number;
}) {
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wonTotal, setWonTotal] = useState(wonCount);
  const [lostTotal, setLostTotal] = useState(lostCount);

  function findLead(leadId: string): { lead: KanbanLead; fromColumn: ColumnId } | null {
    for (const column of COLUMNS) {
      const lead = pipeline[column.id].find((item) => item.id === leadId);
      if (lead) return { lead, fromColumn: column.id };
    }
    return null;
  }

  function moveLead(leadId: string, toColumn: ColumnId | "won" | "lost") {
    const found = findLead(leadId);
    if (!found) return;
    const { lead, fromColumn } = found;
    if (fromColumn === toColumn) return;

    const previousPipeline = pipeline;

    setPipeline((prev) => {
      const next = { ...prev, [fromColumn]: prev[fromColumn].filter((item) => item.id !== leadId) };
      if (toColumn === "new" || toColumn === "contacted" || toColumn === "viewing" || toColumn === "negotiating") {
        next[toColumn] = [lead, ...next[toColumn]];
      }
      return next;
    });

    if (toColumn === "won") setWonTotal((count) => count + 1);
    if (toColumn === "lost") setLostTotal((count) => count + 1);
    setError(null);

    // Fire-and-forget: the pipeline already moved optimistically above —
    // revert it (and the won/lost counters) only if the write fails.
    updateLeadStatusAction(leadId, toColumn).catch(() => {
      setPipeline(previousPipeline);
      if (toColumn === "won") setWonTotal((count) => count - 1);
      if (toColumn === "lost") setLostTotal((count) => count - 1);
      setError("⚠ Failed to update");
    });
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm font-medium text-black">{error}</p>}

      <div className="hidden md:block">
        <div className="flex min-w-max gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverColumn(column.id);
              }}
              onDragLeave={() => setDragOverColumn((current) => (current === column.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const leadId = event.dataTransfer.getData("text/plain");
                setDragOverColumn(null);
                if (leadId) moveLead(leadId, column.id);
              }}
              className={`flex max-h-[calc(100vh-220px)] w-72 shrink-0 flex-col rounded-xl bg-white ${
                dragOverColumn === column.id ? "border-2 border-secondary" : "border border-primary"
              }`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-primary px-4 py-3">
                <span className="text-sm font-semibold text-black">{column.label}</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                  {pipeline[column.id].length}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                {pipeline[column.id].map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", lead.id);
                    }}
                    onWon={() => moveLead(lead.id, "won")}
                    onLost={() => moveLead(lead.id, "lost")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-secondary bg-white p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{wonTotal}</p>
            <p className="text-xs text-primary-mid">Deals won</p>
          </div>
          <div className="rounded-xl border border-primary bg-white p-4 text-center">
            <p className="text-2xl font-bold text-black">{lostTotal}</p>
            <p className="text-xs text-primary-mid">Lost</p>
          </div>
        </div>
      </div>

      <div className="py-8 text-center md:hidden">
        <p className="text-sm text-primary-mid">CRM Pipeline is best viewed on desktop.</p>
        <p className="mt-2 text-sm text-primary-mid">Use Lead Inbox on mobile:</p>
        <Link href="/dashboard/leads" className="text-primary underline">
          View Lead Inbox →
        </Link>
      </div>
    </div>
  );
}
