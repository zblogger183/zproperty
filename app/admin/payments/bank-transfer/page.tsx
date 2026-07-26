import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { BankTransferQueue, type BankTransferTransaction } from "@/components/admin/BankTransferQueue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Bank Transfer Queue | SarZameenz Admin" };

export default async function BankTransferVerificationPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("payment_transactions")
    .select("id, amount, bank_slip_url, initiated_at, user:users(name, email)")
    .eq("method", "bank_transfer")
    .eq("status", "pending")
    .order("initiated_at", { ascending: true });

  const transactions = (data ?? []) as unknown as BankTransferTransaction[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Bank Transfer Queue</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
          {transactions.length} pending
        </span>
      </div>

      <div className="mt-6">
        <BankTransferQueue transactions={transactions} />
      </div>
    </div>
  );
}
