"use client";

import { useState } from "react";
import { CNICVerificationCard, type CNICVerificationAgent } from "./CNICVerificationCard";

export function CNICVerificationQueueClient({ initialAgents }: { initialAgents: CNICVerificationAgent[] }) {
  const [agents, setAgents] = useState(initialAgents);

  function removeAgent(userId: string) {
    setAgents((prev) => prev.filter((agent) => agent.user_id !== userId));
  }

  if (agents.length === 0) {
    return <p className="py-20 text-center text-primary-mid">No CNIC verifications pending.</p>;
  }

  return (
    <div className="mt-6">
      {agents.map((agent) => (
        <CNICVerificationCard key={agent.user_id} agent={agent} onAction={() => removeAgent(agent.user_id)} />
      ))}
    </div>
  );
}
