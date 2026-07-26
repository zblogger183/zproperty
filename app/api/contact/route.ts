import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { email } from "@/lib/notifications/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email: fromEmail, subject, message } = body;

  if (!name || !fromEmail || !message) {
    return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
  }

  await email.contactForm({
    name,
    email: fromEmail,
    subject: subject || "General Enquiry",
    message,
  });

  return NextResponse.json({ ok: true });
}
