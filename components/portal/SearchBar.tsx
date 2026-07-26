"use client";

import { useState } from "react";

export function SearchBar({
  placeholder = "Search by city, area, or society",
  onSearch,
}: {
  placeholder?: string;
  onSearch?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch?.(query);
      }}
      className="flex w-full items-center gap-2"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-secondary bg-bg px-3 py-2 text-sm text-text"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-bg"
      >
        Search
      </button>
    </form>
  );
}
