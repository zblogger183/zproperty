import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Banknote, CheckCircle2, Clock, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payments Overview | SarZameenz Admin" };

const METHOD_TABS = ["all", "stripe", "jazzcash", "easypaisa", "bank_transfer"] as const;
type MethodFilter = (typeof METHOD_TABS)[number];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  completed: "bg-secondary text-primary",
  pending: "border border-primary bg-white text-primary",
  processing: "border border-primary bg-white text-primary",
  failed: "border border-primary bg-white text-black",
  refunded: "bg-primary-mid text-white",
};

interface TransactionRow {
  id: string;
  amount: number;
  method: string;
  status: string;
  gateway_ref: string | null;
  initiated_at: string;
  user: { name: string; email: string | null } | null;
}

export default async function PaymentsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const { method: methodParam } = await searchParams;
  const method: MethodFilter = METHOD_TABS.includes(methodParam as MethodFilter)
    ? (methodParam as MethodFilter)
    : "all";

  const admin = createAdminClient();

  let query = admin
    .from("payment_transactions")
    .select("id, amount, method, status, gateway_ref, initiated_at, user:users(name, email)", { count: "exact" });

  if (method !== "all") query = query.eq("method", method);

  const [{ data, count }, { data: completedAll }] = await Promise.all([
    query.order("initiated_at", { ascending: false }).limit(50),
    admin.from("payment_transactions").select("amount, status"),
  ]);

  const transactions = (data ?? []) as unknown as TransactionRow[];
  const allTxns = completedAll ?? [];
  const totalRevenue = allTxns
    .filter((txn) => txn.status === "completed")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);
  const pendingCount = allTxns.filter((txn) => txn.status === "pending" || txn.status === "processing").length;
  const failedCount = allTxns.filter((txn) => txn.status === "failed").length;

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Payments Overview</h1>
      <p className="mt-1 text-sm text-primary-mid">Platform-wide payment activity.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Revenue" value={`PKR ${totalRevenue.toLocaleString("en-PK")}`} icon={Banknote} />
        <StatCard label="Completed" value={allTxns.filter((t) => t.status === "completed").length} icon={CheckCircle2} />
        <StatCard
          label="Pending/Processing"
          value={pendingCount}
          icon={Clock}
          href="/admin/payments/bank-transfer"
          urgent={pendingCount > 0}
        />
        <StatCard label="Failed" value={failedCount} icon={XCircle} />
      </div>

      <div className="mb-2 mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-white p-4">
        {METHOD_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/payments" : `/admin/payments?method=${tab}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              method === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Method</th>
              <th className="px-4 py-3 text-left font-semibold">Reference</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {format(new Date(txn.initiated_at), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-xs text-black">{txn.user?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-black">
                  PKR {Number(txn.amount).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-3 text-xs capitalize text-primary-mid">{txn.method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">{txn.gateway_ref ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
                      STATUS_BADGE_CLASSES[txn.status] ?? ""
                    }`}
                  >
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No transactions match these filters.</p>
        )}
      </div>
      {count != null && count > transactions.length && (
        <p className="mt-3 text-center text-xs text-primary-mid">Showing the most recent {transactions.length} of {count}.</p>
      )}
    </div>
  );
}
