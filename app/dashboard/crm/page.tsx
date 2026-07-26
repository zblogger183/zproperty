import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KanbanBoard, type Pipeline } from "@/components/dashboard/crm/KanbanBoard";
import type { KanbanLead } from "@/components/dashboard/crm/KanbanCard";

export const dynamic = "force-dynamic";

export default async function CRMPipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: leadsRaw }, { count: wonCount }, { count: lostCount }] = await Promise.all([
    admin
      .from("leads")
      .select(
        `id, lead_type, name, phone, status,
         created_at, last_activity, deal_value,
         listing:listings(id, slug, title, price, purpose)`,
      )
      .eq("agent_id", user.id)
      .not("status", "in", "(won,lost,spam)")
      .order("last_activity", { ascending: false }),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("agent_id", user.id).eq("status", "won"),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("agent_id", user.id).eq("status", "lost"),
  ]);

  const leads = (leadsRaw ?? []) as unknown as KanbanLead[];

  const pipeline: Pipeline = {
    new: leads.filter((lead) => lead.status === "new"),
    contacted: leads.filter((lead) => lead.status === "contacted"),
    viewing: leads.filter((lead) => lead.status === "viewing"),
    negotiating: leads.filter((lead) => lead.status === "negotiating"),
  };

  const totalActive = pipeline.new.length + pipeline.contacted.length + pipeline.viewing.length + pipeline.negotiating.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">CRM Pipeline</h1>
        <Link href="/dashboard/leads" className="text-sm text-primary hover:text-primary-mid">
          View Inbox →
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <p className="text-lg font-bold text-black">{totalActive}</p>
          <p className="text-xs text-primary-mid">Total active</p>
        </div>
        <div>
          <p className="rounded-full bg-secondary px-2 py-0.5 text-lg font-bold text-primary">{wonCount ?? 0}</p>
          <p className="text-xs text-primary-mid">Won</p>
        </div>
        <div>
          <p className="text-lg font-bold text-primary-mid">{lostCount ?? 0}</p>
          <p className="text-xs text-primary-mid">Lost</p>
        </div>
      </div>

      <KanbanBoard initialPipeline={pipeline} wonCount={wonCount ?? 0} lostCount={lostCount ?? 0} />
    </div>
  );
}
