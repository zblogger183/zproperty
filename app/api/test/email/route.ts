import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { email } from "@/lib/notifications/email";

// Dev-only sanity check for the Resend templates — never reachable in prod.
const testData: Record<string, (to: string) => Promise<void>> = {
  welcome: (to) => email.welcome({ to, name: "Ali Raza", role: "agent" }),
  listing_approved: (to) =>
    email.listingApproved({
      to,
      agentName: "Ali Raza",
      listingTitle: "3 Bed Apartment in DHA Phase 6",
      listingSlug: "3-bed-apartment-dha-phase-6",
    }),
  new_lead: (to) =>
    email.newLead({
      to,
      agentName: "Ali Raza",
      leadName: "Hassan Khan",
      leadPhone: "03001234567",
      leadEmail: "hassan@example.com",
      leadType: "whatsapp",
      message: "Is this still available?",
      listingTitle: "3 Bed Apartment in DHA Phase 6",
      listingSlug: "3-bed-apartment-dha-phase-6",
    }),
  payment: (to) =>
    email.paymentConfirmed({
      to,
      name: "Ali Raza",
      planName: "Pro",
      amount: 4999,
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const template = searchParams.get("template") ?? "welcome";
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Missing ?to= query param" }, { status: 400 });
  }

  const sender = testData[template];
  if (!sender) {
    return NextResponse.json(
      { error: `Unknown template "${template}"`, available: Object.keys(testData) },
      { status: 400 },
    );
  }

  await sender(to);

  return NextResponse.json({ ok: true, sent_to: to, template });
}
