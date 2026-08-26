import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = baseMeta({
  title: "Reset Your Password | ZProperty.pk",
  description: "Choose a new password for your ZProperty.pk account.",
  alternates: { canonical: `${SITE_URL}/reset-password` },
});

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unlike the other auth pages, this one requires an active (recovery)
  // session rather than redirecting away from one — it's reached only via
  // the /callback exchange after clicking the reset-password email link.
  if (!user) {
    redirect("/login");
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Enter and confirm your new password below.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
