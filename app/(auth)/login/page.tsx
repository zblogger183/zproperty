import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = baseMeta({
  title: "Login to Your Account | ZProperty.pk",
  description: "Log in to your ZProperty.pk account to manage listings, saved properties, and leads.",
  alternates: { canonical: `${SITE_URL}/login` },
});

export default async function LoginPage() {
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
    <AuthCard title="Welcome Back" subtitle="Sign in to your account">
      <h2 className="sr-only">Login Form</h2>
      <LoginForm />
    </AuthCard>
  );
}
