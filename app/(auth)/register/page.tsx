import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterWizard } from "./RegisterWizard";

export default async function RegisterPage() {
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

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order");

  return (
    <AuthCard>
      <RegisterWizard cities={cities ?? []} />
    </AuthCard>
  );
}
