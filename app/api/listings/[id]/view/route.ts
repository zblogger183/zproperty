import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Per-IP+listing cooldown so repeated page loads / refreshes from the same
// visitor don't inflate the view count. In-memory (resets on restart,
// per-instance in a multi-instance deployment) — fine for a first pass.
const viewRateLimit = new Map<string, number>();
const VIEW_COOLDOWN_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const key = `${ip}:${id}`;
  const now = Date.now();

  const last = viewRateLimit.get(key);
  if (last && now - last < VIEW_COOLDOWN_MS) {
    return NextResponse.json({ ok: true }); // silently ignore
  }
  viewRateLimit.set(key, now);

  const supabase = createAdminClient();
  await supabase.rpc("increment_listing_counter", { listing_id: id, column_name: "views_count" });

  return NextResponse.json({ ok: true });
}
