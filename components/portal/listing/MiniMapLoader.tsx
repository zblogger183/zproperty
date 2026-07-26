"use client";

import dynamic from "next/dynamic";

// `dynamic(..., { ssr: false })` can't be called directly inside a Server
// Component (page.tsx here) — Next.js requires the ssr:false wrapper itself
// to live in a Client Component, hence this one-line indirection.
const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-xl bg-primary-mid" />,
});

export default MiniMap;
