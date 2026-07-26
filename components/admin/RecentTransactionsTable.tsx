import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export type TransactionMethod = "stripe" | "jazzcash" | "easypaisa" | "bank_transfer";
export type TransactionStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export interface RecentTransaction {
  id: string;
  amount: number;
  method: TransactionMethod;
  status: TransactionStatus;
  created_at: string;
  user: { name: string } | null;
}

const METHOD_CLASSES: Record<TransactionMethod, string> = {
  stripe: "bg-primary text-white",
  jazzcash: "bg-primary text-white",
  easypaisa: "bg-primary text-white",
  bank_transfer: "bg-primary-mid text-white",
};

const STATUS_CLASSES: Record<TransactionStatus, string> = {
  completed: "bg-secondary text-primary",
  pending: "border border-primary text-primary",
  processing: "border border-primary text-primary",
  failed: "bg-white text-black border border-primary",
  refunded: "bg-white text-black border border-primary",
};

export function RecentTransactionsTable({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <div className="rounded-xl border border-primary bg-white">
      <div className="flex items-center justify-between border-b border-primary px-5 py-4">
        <h2 className="text-base font-bold text-black">Recent Transactions</h2>
        <Link href="/admin/payments" className="text-sm text-primary hover:text-primary-mid">
          View all →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-primary-mid">No transactions yet</p>
      ) : (
        <table className="w-full table-fixed text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Method</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="truncate px-4 py-3 text-xs text-black">
                  {transaction.user?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-black">
                  PKR {transaction.amount.toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${METHOD_CLASSES[transaction.method]}`}
                  >
                    {transaction.method.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${STATUS_CLASSES[transaction.status]}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
