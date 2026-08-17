"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ListingSearchInput({ currentQuery }: { currentQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(currentQuery ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/admin/listings?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search Property ID or title..."
        className="w-64 rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black placeholder:text-primary-mid"
      />
      <button
        type="submit"
        className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary"
      >
        Search
      </button>
    </form>
  );
}
