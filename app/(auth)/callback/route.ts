import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { generateUniqueAgentSlug } from "../actions";

interface RegisterMetadata {
  name?: string;
  phone?: string;
  role?: string;
  agent?: { agencyName?: string; city?: string; experienceYears?: string; cnic?: string };
  developer?: { companyName?: string; city?: string; website?: string };
}

const EXPERIENCE_YEARS_BY_BUCKET: Record<string, number> = {
  "0-1": 0,
  "2-5": 2,
  "6-10": 6,
  "10+": 10,
};

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
  const user = data.session.user;
  const meta = (user.user_metadata ?? {}) as RegisterMetadata;

  // The registration form's own inserts (app/(auth)/actions.ts) are the
  // normal path for creating these rows — this is only a safety net for
  // when that request never finished (tab closed, transient DB error) or
  // for Google OAuth sign-ins, which never go through that action at all
  // and so have no role metadata (defaulting to "buyer" below matches
  // that: an OAuth sign-in is never anything but a buyer).
  const role = meta.role ?? "buyer";

  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();

  if (!profile) {
    const { error: usersError } = await admin.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        phone: meta.phone ?? user.phone ?? null,
        name: meta.name ?? user.email ?? "New user",
        role,
        email_verified: true,
      },
      { onConflict: "id" },
    );

    if (usersError) {
      console.error("[callback] public.users upsert failed:", usersError);
    }
  }

  if (role === "agent" || role === "developer") {
    const table = role === "agent" ? "agent_profiles" : "developer_profiles";
    const { data: existingProfile } = await admin
      .from(table)
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      const fullName = meta.name ?? "there";

      if (role === "agent") {
        const citySlug = meta.agent?.city;
        const { data: city } = citySlug
          ? await admin.from("cities").select("id").eq("slug", citySlug).maybeSingle()
          : { data: null };

        const { error: agentError } = await admin.from("agent_profiles").upsert(
          {
            user_id: user.id,
            profile_slug: await generateUniqueAgentSlug(admin, fullName),
            cnic_number: meta.agent?.cnic ?? null,
            experience_years: EXPERIENCE_YEARS_BY_BUCKET[meta.agent?.experienceYears ?? ""] ?? 0,
            cities_served: city ? [city.id] : [],
            subscription_tier: "free",
          },
          { onConflict: "user_id" },
        );

        if (agentError) {
          console.error("[callback] agent_profiles upsert failed:", agentError);
        }
      } else {
        const citySlug = meta.developer?.city;
        const { data: city } = citySlug
          ? await admin.from("cities").select("id").eq("slug", citySlug).maybeSingle()
          : { data: null };

        const { error: developerError } = await admin.from("developer_profiles").upsert(
          {
            user_id: user.id,
            company_name: meta.developer?.companyName ?? `${fullName}'s Company`,
            city_id: city?.id ?? null,
            website: meta.developer?.website ?? null,
          },
          { onConflict: "user_id" },
        );

        if (developerError) {
          console.error("[callback] developer_profiles upsert failed:", developerError);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${getRoleRedirectPath(profile?.role ?? role)}`);
}
