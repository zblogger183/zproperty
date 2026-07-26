import type { Lead } from "./LeadCard";

const STAGES = ["New", "Contacted", "Viewing Scheduled", "Negotiating", "Closed"] as const;

export function CRMPipeline({ leadsByStage }: { leadsByStage: Record<(typeof STAGES)[number], Lead[]> }) {
  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-5">
      {STAGES.map((stage) => (
        <div key={stage} className="min-w-[200px] rounded-lg border border-secondary p-3">
          <h3 className="text-sm font-semibold text-primary">{stage}</h3>
          <p className="mt-1 text-xs text-text">{leadsByStage[stage]?.length ?? 0} leads</p>
        </div>
      ))}
    </div>
  );
}
