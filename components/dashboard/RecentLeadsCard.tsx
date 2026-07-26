import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Mail, MessageCircle, Phone } from "lucide-react";

export interface RecentLead {
  id: string;
  lead_type: "call" | "whatsapp" | "email" | "form";
  name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  message: string | null;
  listing: { title: string; slug: string; primary_image_url: string | null } | null;
}

const LEAD_TYPE_STYLES: Record<RecentLead["lead_type"], { className: string; Icon: typeof Phone }> = {
  call: { className: "bg-primary text-white", Icon: Phone },
  whatsapp: { className: "bg-secondary text-primary", Icon: MessageCircle },
  email: { className: "bg-primary-mid text-white", Icon: Mail },
  form: { className: "bg-primary text-white", Icon: FileText },
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-secondary text-primary",
  contacted: "bg-primary-mid text-white",
};

export function RecentLeadsCard({ leads }: { leads: RecentLead[] }) {
  return (
    <div className="rounded-xl border border-primary bg-white">
      <div className="flex items-center justify-between border-b border-primary px-5 py-4">
        <h2 className="text-base font-bold text-black">Recent Leads</h2>
        <Link href="/dashboard/leads" className="text-sm text-primary hover:text-primary-mid">
          View all →
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-primary-mid">
          No leads yet. Listings approved by admin will start receiving enquiries.
        </p>
      ) : (
        <div className="divide-y divide-primary">
          {leads.map((lead) => {
            const { className, Icon } = LEAD_TYPE_STYLES[lead.lead_type];
            const statusClassName = STATUS_STYLES[lead.status] ?? "border border-primary text-primary-mid";

            return (
              <div key={lead.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black">
                    {lead.name ?? "Anonymous"}
                    <span className="ml-2 text-xs font-normal text-primary-mid">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </span>
                  </p>
                  {lead.listing && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-primary-mid">
                      <Link href={`/listing/${lead.listing.slug}`} className="text-primary hover:underline">
                        {lead.listing.title}
                      </Link>
                    </p>
                  )}
                  {lead.lead_type === "form" && lead.message && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-primary-mid">
                      {lead.message.slice(0, 60)}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusClassName}`}
                >
                  {lead.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
