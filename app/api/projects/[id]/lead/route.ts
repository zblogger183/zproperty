import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/inapp";

// Same in-memory, per-instance rate limit pattern as
// app/api/listings/[id]/lead/route.ts.
const leadRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

type LeadType = "form" | "call" | "whatsapp" | "email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const key = `${ip}:${id}`;
  const now = Date.now();

  const hits = (leadRateLimit.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  leadRateLimit.set(key, [...hits, now]);

  const body = await request.json();
  const type: LeadType = body.type ?? "form";
  const { name, phone, message } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("developer_id, name, leads_count")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await admin.from("leads").insert({
    project_id: id,
    developer_id: project.developer_id,
    lead_type: type,
    name,
    phone,
    message: message ?? null,
    source_page: request.headers.get("referer") ?? null,
    ip_address: ip,
    status: "new",
  });

  await admin.from("projects").update({ leads_count: (project.leads_count ?? 0) + 1 }).eq("id", id);

  if (project.developer_id) {
    await createNotification({
      user_id: project.developer_id,
      type: "new_lead",
      title: "New Project Enquiry",
      body: `${name} enquired about your project "${project.name}"`,
      data: { project_id: id },
    });
  }

  return NextResponse.json({ ok: true });
}
