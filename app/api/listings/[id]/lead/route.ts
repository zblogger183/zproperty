import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { email as emailNotify } from "@/lib/notifications/email";
import { wa } from "@/lib/notifications/whatsapp";

// Simple in-memory rate limit (resets on server restart / differs per
// instance in a multi-instance deployment) — good enough for a first pass,
// not a substitute for a shared store later.
const leadRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

type LeadType = "form" | "call" | "whatsapp" | "email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const key = `${ip}:${id}`;
  const now = Date.now();

  const hits = (leadRateLimit.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (hits.length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  leadRateLimit.set(key, [...hits, now]);

  const body = await request.json();
  const type: LeadType = body.type;
  const { name, phone, message, email } = body;
  const supabase = createAdminClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("agent_id, agency_id, title, slug")
    .eq("id", id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase.from("leads").insert({
    listing_id: id,
    agent_id: listing.agent_id,
    agency_id: listing.agency_id,
    lead_type: type,
    name: name ?? null,
    phone: phone ?? null,
    message: message ?? null,
    source_page: request.headers.get("referer") ?? null,
    ip_address: ip,
    status: "new",
  });

  // `leads_count` increments for every lead type; call/whatsapp additionally
  // bump their own specific counter. Kept as two separate steps rather than
  // one ternary + an "if type !== 'form'" exception — that pattern double
  // counts leads_count for 'email' (it falls into the ternary's shared
  // "else" bucket with 'form', but only 'form' was excluded from the extra
  // bump), so every type but form ends up incrementing leads_count twice.
  const specificColumn = type === "call" ? "calls_count" : type === "whatsapp" ? "whatsapp_count" : null;

  if (specificColumn) {
    await supabase.rpc("increment_listing_counter", { listing_id: id, column_name: specificColumn });
  }

  await supabase.rpc("increment_listing_counter", { listing_id: id, column_name: "leads_count" });

  if (listing.agent_id) {
    const [{ data: agentUser }, { data: agentProfile }] = await Promise.all([
      supabase.from("users").select("email, name").eq("id", listing.agent_id).single(),
      supabase.from("agent_profiles").select("whatsapp").eq("user_id", listing.agent_id).single(),
    ]);

    if (agentUser?.email) {
      await emailNotify.newLead({
        to: agentUser.email,
        agentName: agentUser.name ?? "there",
        leadName: name ?? "Anonymous",
        leadPhone: phone ?? "",
        leadEmail: email ?? undefined,
        leadType: type,
        message: message ?? undefined,
        listingTitle: listing.title,
        listingSlug: listing.slug ?? "",
      });
    }
    if (agentProfile?.whatsapp) {
      await wa.newLead(agentProfile.whatsapp, {
        leadType: type,
        listingTitle: listing.title,
        leadName: name ?? "Anonymous",
        leadPhone: phone ?? "",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
