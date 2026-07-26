import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBankTransferAction } from "@/app/admin/payments/actions";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    transactionId?: string;
    approved?: boolean;
    note?: string;
  };

  if (!body.transactionId || typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "transactionId and approved are required" }, { status: 400 });
  }

  try {
    // verifyBankTransferAction runs verifyAdmin() itself, which throws for
    // an unauthenticated or non-admin caller — that's the only auth check
    // this route needs, so it isn't duplicated here.
    const result = await verifyBankTransferAction(body.transactionId, body.approved, body.note);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
