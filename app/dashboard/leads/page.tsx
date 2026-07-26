import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadCard, type LeadWithDetails } from "@/components/dashboard/leads/LeadCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "new", "contacted", "viewing", "negotiating", "won", "lost", "spam"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];
const TYPE_TABS = ["all", "call", "whatsapp", "email", "form"] as const;
type TypeFilter = (typeof TYPE_TABS)[number];

export default async function LeadInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status: StatusFilter = STATUS_TABS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";
  const type: TypeFilter = TYPE_TABS.includes(params.type as TypeFilter) ? (params.type as TypeFilter) : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  let leadsQuery = admin
    .from("leads")
    .select(
      `id, lead_type, name, phone, email, message,
       status, created_at, updated_at, last_activity,
       next_followup, deal_value, source_page,
       listing:listings(id, slug, title, purpose, type, primary_image_url, price),
       notes:lead_notes(id, note, created_at)`,
      { count: "exact" },
    )
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status !== "all") leadsQuery = leadsQuery.eq("status", status);
  if (type !== "all") leadsQuery = leadsQuery.eq("lead_type", type);

  const [{ data: leadsRaw, count }, { data: allLeads }] = await Promise.all([
    leadsQuery,
    admin.from("leads").select("status, lead_type").eq("agent_id", user.id),
  ]);

  const leads = ((leadsRaw ?? []) as unknown as LeadWithDetails[]).map((lead) => ({
    ...lead,
    notes: [...lead.notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }));
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusCounts: Record<StatusFilter, number> = {
    all: allLeads?.length ?? 0,
    new: allLeads?.filter((l) => l.status === "new").length ?? 0,
    contacted: allLeads?.filter((l) => l.status === "contacted").length ?? 0,
    viewing: allLeads?.filter((l) => l.status === "viewing").length ?? 0,
    negotiating: allLeads?.filter((l) => l.status === "negotiating").length ?? 0,
    won: allLeads?.filter((l) => l.status === "won").length ?? 0,
    lost: allLeads?.filter((l) => l.status === "lost").length ?? 0,
    spam: allLeads?.filter((l) => l.status === "spam").length ?? 0,
  };
  const typeCounts: Record<TypeFilter, number> = {
    all: allLeads?.length ?? 0,
    call: allLeads?.filter((l) => l.lead_type === "call").length ?? 0,
    whatsapp: allLeads?.filter((l) => l.lead_type === "whatsapp").length ?? 0,
    email: allLeads?.filter((l) => l.lead_type === "email").length ?? 0,
    form: allLeads?.filter((l) => l.lead_type === "form").length ?? 0,
  };
  const newLeadsCount = statusCounts.new;

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (status !== "all") next.set("status", status);
    if (type !== "all") next.set("type", type);
    if (page > 1) next.set("page", String(page));

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in overrides)) next.delete("page");

    const qs = next.toString();
    return qs ? `/dashboard/leads?${qs}` : "/dashboard/leads";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Lead Inbox</h1>
        {newLeadsCount > 0 && (
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
            {newLeadsCount} new
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildHref({ status: tab === "all" ? undefined : tab })}
            className={`rounded-lg px-4 py-2 text-sm capitalize ${
              status === tab ? "bg-secondary font-bold text-primary" : "border border-primary bg-white text-primary"
            }`}
          >
            {tab} ({statusCounts[tab]})
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildHref({ type: tab === "all" ? undefined : tab })}
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${
              type === tab ? "bg-primary text-white" : "border border-primary bg-white text-primary-mid"
            }`}
          >
            {tab === "all" ? "All Types" : tab} ({typeCounts[tab]})
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {leads.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-black">No leads yet.</p>
            <p className="mt-2 text-sm text-primary-mid">
              When buyers call, WhatsApp, or message you through your listings, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Link
            href={buildHref({ page: String(Math.max(1, page - 1)) })}
            aria-disabled={page === 1}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-primary text-primary ${
              page === 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ‹
          </Link>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildHref({ page: String(pageNumber) })}
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                pageNumber === page ? "bg-secondary text-primary" : "border border-primary text-primary"
              }`}
            >
              {pageNumber}
            </Link>
          ))}
          <Link
            href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
            aria-disabled={page === totalPages}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-primary text-primary ${
              page === totalPages ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ›
          </Link>
        </div>
      )}
    </div>
  );
}
