import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoleRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", data.session.user.id)
    .maybeSingle();

  if (!profile) {
    const meta = data.session.user.user_metadata as { name?: string; phone?: string } | null;

    await admin.from("users").insert({
      id: data.session.user.id,
      email: data.session.user.email,
      phone: meta?.phone ?? data.session.user.phone ?? null,
      name: meta?.name ?? data.session.user.email ?? "New user",
      role: "buyer",
    });
  }

  return NextResponse.redirect(`${origin}${getRoleRedirectPath(profile?.role)}`);
}
