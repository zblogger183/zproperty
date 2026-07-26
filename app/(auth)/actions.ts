"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { slugify } from "@/lib/utils";
import { email as emailNotify } from "@/lib/notifications/email";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loginSchema,
  otpIdentifierSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  registerStep1Schema,
  registerRoleSchema,
  registerAgentDetailsSchema,
  registerDeveloperDetailsSchema,
  type RegisterRole,
} from "./schemas";

type ActionResult = { error: string } | void;

async function getSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

function normalizeIdentifier(identifier: string): { email?: string; phone?: string } {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed.toLowerCase() };
  }
  const digits = trimmed.replace(/\D/g, "").replace(/^0+/, "");
  return { phone: `+92${digits}` };
}

function experienceYearsToNumber(bucket: string): number {
  switch (bucket) {
    case "0-1":
      return 0;
    case "2-5":
      return 2;
    case "6-10":
      return 6;
    case "10+":
      return 10;
    default:
      return 0;
  }
}

async function fetchRoleForUser(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
  return (data?.role as string | undefined) ?? null;
}

async function generateUniqueAgentSlug(admin: SupabaseClient, fullName: string): Promise<string> {
  const base = slugify(fullName) || "agent";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin
      .from("agent_profiles")
      .select("id")
      .eq("profile_slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginWithPasswordAction(values: {
  identifier: string;
  password: string;
}): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter your email/phone and password." };
  }

  const supabase = await createClient();
  const { email, phone } = normalizeIdentifier(parsed.data.identifier);

  const { data, error } = email
    ? await supabase.auth.signInWithPassword({ email, password: parsed.data.password })
    : await supabase.auth.signInWithPassword({ phone: phone!, password: parsed.data.password });

  if (error || !data.user) {
    return { error: "Incorrect email/phone or password." };
  }

  const role = await fetchRoleForUser(data.user.id);
  redirect(getRoleRedirectPath(role));
}

export async function sendLoginOtpAction(values: { identifier: string }): Promise<ActionResult> {
  const parsed = otpIdentifierSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter your email or phone number." };
  }

  const supabase = await createClient();
  const { email, phone } = normalizeIdentifier(parsed.data.identifier);

  const { error } = email
    ? await supabase.auth.signInWithOtp({ email })
    : await supabase.auth.signInWithOtp({ phone: phone! });

  if (error) {
    return { error: error.message };
  }

  redirect(`/verify-otp?identifier=${encodeURIComponent(email ?? phone!)}&purpose=login`);
}

export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_unavailable");
  }

  redirect(data.url);
}

// ---------------------------------------------------------------------------
// OTP verification (shared by login-via-OTP and post-registration verification)
// ---------------------------------------------------------------------------

export async function verifyOtpAction(values: {
  identifier: string;
  code: string;
  purpose: "login" | "signup";
}): Promise<ActionResult> {
  const parsed = verifyOtpSchema.safeParse({ code: values.code });
  if (!parsed.success) {
    return { error: "Enter the 6-digit code." };
  }

  const supabase = await createClient();
  const { email, phone } = normalizeIdentifier(values.identifier);

  const { data, error } = email
    ? await supabase.auth.verifyOtp({
        email,
        token: parsed.data.code,
        type: values.purpose === "signup" ? "signup" : "email",
      })
    : await supabase.auth.verifyOtp({
        phone: phone!,
        token: parsed.data.code,
        type: "sms",
      });

  if (error || !data.user) {
    return { error: "That code is invalid or has expired." };
  }

  const role = await fetchRoleForUser(data.user.id);
  redirect(getRoleRedirectPath(role));
}

export async function resendOtpAction(values: {
  identifier: string;
  purpose: "login" | "signup";
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { email, phone } = normalizeIdentifier(values.identifier);

  const { error } =
    values.purpose === "signup"
      ? email
        ? await supabase.auth.resend({ type: "signup", email })
        : await supabase.auth.resend({ type: "sms", phone: phone! })
      : email
        ? await supabase.auth.signInWithOtp({ email })
        : await supabase.auth.signInWithOtp({ phone: phone! });

  if (error) {
    return { error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: RegisterRole;
  agent?: {
    agencyName?: string;
    city: string;
    experienceYears: string;
    cnic: string;
  };
  developer?: {
    companyName: string;
    city: string;
    website?: string;
  };
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const step1 = registerStep1Schema.safeParse({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    password: input.password,
    confirmPassword: input.password,
  });
  if (!step1.success) {
    return { error: "Check the details you entered and try again." };
  }

  const role = registerRoleSchema.safeParse(input.role);
  if (!role.success) {
    return { error: "Select an account type." };
  }

  if (role.data === "agent") {
    const agent = registerAgentDetailsSchema.safeParse(input.agent);
    if (!agent.success) {
      return { error: "Check your agent details and try again." };
    }
  }

  if (role.data === "developer") {
    const developer = registerDeveloperDetailsSchema.safeParse(input.developer);
    if (!developer.success) {
      return { error: "Check your company details and try again." };
    }
  }

  const phone = `+92${input.phone}`;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { name: input.fullName, phone, role: role.data },
    },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Could not create your account." };
  }

  const admin = createAdminClient();

  const { error: insertError } = await admin.from("users").insert({
    id: data.user.id,
    email: input.email,
    phone,
    name: input.fullName,
    role: role.data,
  });

  if (insertError) {
    return {
      error: "Your account was created, but we couldn't finish setup. Contact support.",
    };
  }

  if (role.data === "agent" && input.agent) {
    const profileSlug = await generateUniqueAgentSlug(admin, input.fullName);
    const { data: city } = await admin
      .from("cities")
      .select("id")
      .eq("slug", input.agent.city)
      .maybeSingle();

    await admin.from("agent_profiles").insert({
      user_id: data.user.id,
      profile_slug: profileSlug,
      cnic_number: input.agent.cnic,
      experience_years: experienceYearsToNumber(input.agent.experienceYears),
      cities_served: city ? [city.id] : [],
      subscription_tier: "free",
    });
  }

  if (role.data === "developer" && input.developer) {
    const { data: city } = await admin
      .from("cities")
      .select("id")
      .eq("slug", input.developer.city)
      .maybeSingle();

    await admin.from("developer_profiles").insert({
      user_id: data.user.id,
      company_name: input.developer.companyName,
      city_id: city?.id ?? null,
      website: input.developer.website || null,
    });
  }

  await emailNotify.welcome({ to: input.email, name: input.fullName, role: role.data });

  redirect(`/verify-otp?identifier=${encodeURIComponent(input.email)}&purpose=signup`);
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(values: {
  email: string;
}): Promise<{ error: string } | { success: true }> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/callback?type=recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePasswordAction(values: {
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your password and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login");
}
