import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserStatusToggle } from "@/components/admin/UserStatusToggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "All Users | SarZameenz Admin" };

const ROLE_TABS = ["all", "agent", "buyer", "developer", "admin"] as const;
type RoleFilter = (typeof ROLE_TABS)[number];

const ROLE_BADGE_CLASSES: Record<string, string> = {
  super_admin: "bg-primary text-secondary font-bold",
  admin: "bg-primary text-white",
  agent: "bg-secondary text-primary font-bold",
  developer: "bg-primary-mid text-white",
  buyer: "border border-primary bg-white text-primary",
};

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default async function AllUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const role: RoleFilter = ROLE_TABS.includes(roleParam as RoleFilter) ? (roleParam as RoleFilter) : "all";

  const admin = createAdminClient();

  let query = admin
    .from("users")
    .select("id, name, email, phone, role, is_active, created_at, last_login")
    .order("created_at", { ascending: false })
    .limit(100);

  if (role === "admin") {
    query = query.in("role", ["admin", "super_admin"]);
  } else if (role !== "all") {
    query = query.eq("role", role);
  }

  const { data: users } = await query;
  const rows = (users ?? []) as UserRow[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">All Users</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {rows.length}
        </span>
      </div>

      <div className="mb-6 mt-6 flex flex-wrap gap-2">
        {ROLE_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/users" : `/admin/users?role=${tab}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              role === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab === "all" ? "All" : `${tab}s`}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email/Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 text-sm font-semibold text-black">{user.name}</td>
                <td className="px-4 py-3">
                  <p className="text-xs text-primary-mid">{user.email ?? "—"}</p>
                  <p className="text-xs text-primary-mid">{user.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
                      ROLE_BADGE_CLASSES[user.role] ?? ""
                    }`}
                  >
                    {user.role.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-primary">Active</span>
                  ) : (
                    <span className="rounded-full border border-primary bg-white px-2 py-0.5 text-[10px] text-primary-mid">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{format(new Date(user.created_at), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <UserStatusToggle userId={user.id} isActive={user.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && <p className="py-8 text-center text-sm text-primary-mid">No users found.</p>}
      </div>
    </div>
  );
}
