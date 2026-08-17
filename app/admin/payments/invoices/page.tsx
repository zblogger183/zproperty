import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Invoices | ZProperty Admin" };

interface InvoiceRow {
  id: string;
  amount: number;
  method: string;
  status: string;
  invoice_number: string | null;
  invoice_url: string | null;
  completed_at: string | null;
  initiated_at: string;
  user: { name: string; email: string | null } | null;
}

export default async function InvoicesPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("payment_transactions")
    .select("id, amount, method, status, invoice_number, invoice_url, completed_at, initiated_at, user:users(name, email)")
    .eq("status", "completed")
    .order("initiated_at", { ascending: false })
    .limit(100);

  const invoices = (data ?? []) as unknown as InvoiceRow[];

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Invoices</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Issued invoices for completed payments. Invoice numbers/PDFs are only present for transactions that had one
        generated at payment time — this page doesn&apos;t generate them retroactively.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Invoice #</th>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Method</th>
              <th className="px-4 py-3 text-left font-semibold">Paid On</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 font-mono text-xs text-black">{invoice.invoice_number ?? "—"}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-black">{invoice.user?.name ?? "—"}</p>
                  <p className="text-xs text-primary-mid">{invoice.user?.email ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-black">
                  PKR {Number(invoice.amount).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-3 text-xs capitalize text-primary-mid">{invoice.method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {format(new Date(invoice.completed_at ?? invoice.initiated_at), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  {invoice.invoice_url ? (
                    <Link href={invoice.invoice_url} target="_blank" className="text-xs font-semibold text-primary underline">
                      Download
                    </Link>
                  ) : (
                    <span className="text-xs text-primary-mid">Not generated</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No completed payments yet.</p>
        )}
      </div>
    </div>
  );
}
