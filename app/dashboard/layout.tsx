import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar, type DashboardUser } from "@/components/dashboard/DashboardSidebar";

export default async function AgentDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sidebarUser: DashboardUser = { id: "", name: "Account", role: "agent" };

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      sidebarUser = { id: user.id, name: profile.name as string, role: profile.role as string };
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardSidebar user={sidebarUser} />
      <div className="min-h-screen bg-white md:ml-[220px]">{children}</div>
    </div>
  );
}
