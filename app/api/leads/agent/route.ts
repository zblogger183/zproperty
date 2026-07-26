import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Same lightweight per-IP+agent rate limit as app/api/listings/[id]/lead —
// good enough for a first pass, not a substitute for a shared store later.
const leadRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    agent_id?: string;
    name?: string;
    phone?: string;
    message?: string;
  };

  if (!body.agent_id) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const key = `${ip}:${body.agent_id}`;
  const now = Date.now();

  const hits = (leadRateLimit.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (hits.length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  leadRateLimit.set(key, [...hits, now]);

  const admin = createAdminClient();

  await admin.from("leads").insert({
    agent_id: body.agent_id,
    listing_id: null,
    lead_type: "form",
    name: body.name ?? null,
    phone: body.phone ?? null,
    message: body.message ?? null,
    source_page: request.headers.get("referer") ?? null,
    ip_address: ip,
    status: "new",
  });

  return NextResponse.json({ ok: true });
}
