import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: notifications } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return NextResponse.json({ notifications: notifications ?? [], unread_count: unreadCount });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { notification_ids?: string[]; all?: boolean };
  const admin = createAdminClient();

  if (body.all) {
    await admin.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  } else if (body.notification_ids?.length) {
    await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .in("id", body.notification_ids);
  }

  return NextResponse.json({ ok: true });
}
