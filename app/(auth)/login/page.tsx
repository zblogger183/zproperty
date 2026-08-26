import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "./LoginForm";

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
      <LoginForm />
    </AuthCard>
  );
}
