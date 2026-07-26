import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar, type AdminUser } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export default async function AdminCMSLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role as string)) {
    redirect("/dashboard");
  }

  const adminUser: AdminUser = { id: user.id, name: profile.name as string, role: profile.role as string };

  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar user={adminUser} />
      <div className="min-h-screen bg-white md:ml-56">
        <AdminTopBar user={adminUser} />
        <main>{children}</main>
      </div>
    </div>
  );
}
