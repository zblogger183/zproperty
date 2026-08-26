import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = baseMeta({
  title: "Forgot Password | ZProperty.pk",
  description: "Reset your ZProperty.pk account password.",
  alternates: { canonical: `${SITE_URL}/forgot-password` },
});

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    redirect(getRoleRedirectPath(profile?.role as string | undefined));
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new password.">
      <h2 className="sr-only">Password Reset Request Form</h2>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
