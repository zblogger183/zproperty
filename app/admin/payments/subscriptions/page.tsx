import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Subscriptions | ZProperty Admin" };

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary",
  trialing: "bg-primary-mid text-white",
  cancelled: "border border-primary bg-white text-black",
  expired: "border border-primary bg-white text-primary-mid",
  past_due: "bg-primary text-white",
};

interface SubscriptionRow {
  id: string;
  status: string;
  billing_cycle: string;
  price_paid: number;
  starts_at: string;
  ends_at: string | null;
  user: { id: string; name: string; email: string | null } | null;
  plan: { name: string } | null;
}

export default async function AdminSubscriptionsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("subscriptions")
    .select("id, status, billing_cycle, price_paid, starts_at, ends_at, user:users(id, name, email), plan:subscription_plans(name)")
    .order("starts_at", { ascending: false })
    .limit(100);

  const subscriptions = (data ?? []) as unknown as SubscriptionRow[];
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Subscriptions</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
          {activeCount} active
        </span>
      </div>
      <p className="mt-1 text-sm text-primary-mid">Manage agent/agency subscriptions.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Plan</th>
              <th className="px-4 py-3 text-left font-semibold">Billing</th>
              <th className="px-4 py-3 text-left font-semibold">Price Paid</th>
              <th className="px-4 py-3 text-left font-semibold">Started</th>
              <th className="px-4 py-3 text-left font-semibold">Ends</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3">
                  {sub.user ? (
                    <Link href={`/admin/users/agents/${sub.user.id}`} className="text-sm font-medium text-black hover:underline">
                      {sub.user.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-primary-mid">—</span>
                  )}
                  <p className="text-xs text-primary-mid">{sub.user?.email ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-sm capitalize text-black">{sub.plan?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs capitalize text-primary-mid">{sub.billing_cycle}</td>
                <td className="px-4 py-3 text-sm font-semibold text-black">
                  PKR {Number(sub.price_paid).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{format(new Date(sub.starts_at), "MMM d, yyyy")}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {sub.ends_at ? format(new Date(sub.ends_at), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
                      STATUS_BADGE_CLASSES[sub.status] ?? ""
                    }`}
                  >
                    {sub.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subscriptions.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No subscriptions yet.</p>
        )}
      </div>
    </div>
  );
}
