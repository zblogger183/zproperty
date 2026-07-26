export interface Lead {
  id: string;
  name: string;
  phone: string;
  message: string;
  listingTitle: string;
  createdAt: string;
}

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-lg border border-secondary p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-primary">{lead.name}</span>
        <span className="text-xs text-text">{new Date(lead.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="mt-1 text-sm text-text">{lead.listingTitle}</p>
      <p className="mt-2 text-sm text-text">{lead.message}</p>
      <p className="mt-2 text-sm font-medium text-primary">{lead.phone}</p>
    </div>
  );
}
