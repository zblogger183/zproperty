import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { baseMeta } from "@/lib/seo/metadata";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterWizard } from "./RegisterWizard";

export const metadata: Metadata = baseMeta({
  title: "Create an Account | ZProperty.pk",
  description:
    "Sign up for a free ZProperty.pk account as a buyer, agent, or developer and start browsing or listing properties across Pakistan.",
});

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
    <AuthCard title="Create an Account">
      <RegisterWizard cities={cities ?? []} />
    </AuthCard>
  );
}
