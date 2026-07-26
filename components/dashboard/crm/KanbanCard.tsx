"use client";

import type { DragEvent } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Mail, MessageCircle, Phone } from "lucide-react";

export interface KanbanLead {
  id: string;
  lead_type: "call" | "whatsapp" | "email" | "form";
  name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  last_activity: string;
  deal_value: number | null;
  listing: { id: string; slug: string; title: string; price: number; purpose: string } | null;
}

const LEAD_TYPE_ICONS: Record<KanbanLead["lead_type"], typeof Phone> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  form: FileText,
};

function ageBorderClass(createdAt: string): string {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays < 2) return "border-l-4 border-secondary";
  if (ageDays <= 7) return "border-l-4 border-primary-mid";
  return "border-l-4 border-primary";
}

export function KanbanCard({
  lead,
  onDragStart,
  onWon,
  onLost,
}: {
  lead: KanbanLead;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onWon: () => void;
  onLost: () => void;
}) {
  const Icon = LEAD_TYPE_ICONS[lead.lead_type];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab rounded-xl border border-primary bg-white p-3 active:cursor-grabbing ${ageBorderClass(lead.created_at)}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-black">{lead.name ?? "Anonymous"}</p>
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <p className="mt-1 line-clamp-1 text-xs text-primary-mid">
        {lead.listing ? lead.listing.title : "No listing (profile enquiry)"}
      </p>

      <p className="mt-1 text-[10px] text-primary-mid">
        {formatDistanceToNow(new Date(lead.last_activity), { addSuffix: true })}
      </p>

      {lead.deal_value != null && (
        <p className="mt-1 text-xs font-semibold text-black">PKR {lead.deal_value.toLocaleString("en-PK")}</p>
      )}

      <div className="mt-2 flex items-center gap-2 border-t border-primary pt-2">
        <button
          type="button"
          onClick={onWon}
          className="rounded bg-secondary px-2 py-1 text-[10px] font-bold text-primary"
        >
          Won
        </button>
        <button
          type="button"
          onClick={onLost}
          className="rounded border border-primary px-2 py-1 text-[10px] text-primary-mid"
        >
          Lost
        </button>
        <Link href={`/dashboard/leads?highlight=${lead.id}`} className="ml-auto text-[10px] text-primary">
          View →
        </Link>
      </div>
    </div>
  );
}
