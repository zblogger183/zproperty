import Link from "next/link";
import type { UserProfile } from "@/types";

export function AgentCard({ agent }: { agent: Pick<UserProfile, "id" | "fullName" | "avatarUrl"> & { slug: string } }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="flex items-center gap-3 rounded-lg border border-secondary p-4 transition hover:border-primary"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
        {agent.avatarUrl && (
          <img src={agent.avatarUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <span className="font-medium text-primary">{agent.fullName}</span>
    </Link>
  );
}
