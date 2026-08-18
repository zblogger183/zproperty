import { z } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Same lightweight per-IP+agent rate limit as app/api/listings/[id]/lead —
// good enough for a first pass, not a substitute for a shared store later.
const leadRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const leadSchema = z.object({
  agent_id: z.string().uuid(),
  name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const rawBody = await request.json();
  const parsed = leadSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const body = parsed.data;

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

  // agent_id must reference a real, active agent/developer account — without
  // this, any UUID (real or fabricated) could be attributed a lead, letting
  // an attacker spam a targeted agent's CRM with junk under their name.
  const { data: agent } = await admin
    .from("users")
    .select("id")
    .eq("id", body.agent_id)
    .in("role", ["agent", "developer"])
    .maybeSingle();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

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
