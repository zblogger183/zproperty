"use client";

import { useState } from "react";

export interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
}

export function RedirectManager({
  rules,
  onCreate,
}: {
  rules: RedirectRule[];
  onCreate: (rule: Omit<RedirectRule, "id">) => void;
}) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-left text-sm text-text">
        <thead>
          <tr className="border-b border-secondary">
            <th className="py-2">Source</th>
            <th className="py-2">Destination</th>
            <th className="py-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className="border-b border-secondary/50">
              <td className="py-2">{rule.source}</td>
              <td className="py-2">{rule.destination}</td>
              <td className="py-2">{rule.permanent ? "308" : "307"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({ source, destination, permanent: true });
          setSource("");
          setDestination("");
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col gap-1 text-sm text-text">
          Source
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-md border border-secondary bg-bg px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text">
          Destination
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="rounded-md border border-secondary bg-bg px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-bg">
          Add Redirect
        </button>
      </form>
    </div>
  );
}
