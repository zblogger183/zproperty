import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddMonthlyReportForm } from "@/components/admin/AddMonthlyReportForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Marketing Client Detail | ZProperty Admin" };

interface MonthlyReportRow {
  id: string;
  month: string;
  leads_count: number | null;
  spend_pkr: number | null;
  cpl: number | null;
  report_url: string | null;
  notes: string | null;
}

export default async function MarketingClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const admin = createAdminClient();

  const [{ data: client }, { data: reportsRaw }] = await Promise.all([
    admin
      .from("dm_clients")
      .select("id, business_name, contact_name, contact_phone, contact_email, service_type, package_name, monthly_fee, status, start_date, notes")
      .eq("id", clientId)
      .single(),
    admin
      .from("dm_monthly_reports")
      .select("id, month, leads_count, spend_pkr, cpl, report_url, notes")
      .eq("client_id", clientId)
      .order("month", { ascending: false }),
  ]);

  if (!client) notFound();

  const reports = (reportsRaw ?? []) as MonthlyReportRow[];

  return (
    <div className="px-6 py-6">
      <Link href="/admin/marketing/clients" className="text-sm text-primary hover:text-primary-mid">
        ← Marketing Clients
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">{client.business_name}</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-primary bg-white p-5 md:col-span-1">
          <h2 className="mb-3 text-base font-bold text-black">Client Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Contact</dt>
              <dd className="text-black">{client.contact_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Phone</dt>
              <dd className="text-black">{client.contact_phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Email</dt>
              <dd className="text-black">{client.contact_email ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Service</dt>
              <dd className="text-black">{client.service_type ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Package</dt>
              <dd className="text-black">{client.package_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Monthly Fee</dt>
              <dd className="text-black">
                {client.monthly_fee ? `PKR ${Number(client.monthly_fee).toLocaleString("en-PK")}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-primary-mid">Started</dt>
              <dd className="text-black">
                {client.start_date ? format(new Date(client.start_date), "MMM d, yyyy") : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="md:col-span-2">
          <AddMonthlyReportForm clientId={client.id} />

          <div className="mt-4 overflow-hidden rounded-xl border border-primary bg-white">
            <table className="w-full text-sm">
              <thead className="bg-primary text-xs text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Month</th>
                  <th className="px-4 py-3 text-left font-semibold">Leads</th>
                  <th className="px-4 py-3 text-left font-semibold">Spend</th>
                  <th className="px-4 py-3 text-left font-semibold">CPL</th>
                  <th className="px-4 py-3 text-left font-semibold">Report</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-primary last:border-b-0">
                    <td className="px-4 py-3 text-sm text-black">{format(new Date(report.month), "MMM yyyy")}</td>
                    <td className="px-4 py-3 text-sm text-black">{report.leads_count ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {report.spend_pkr ? `PKR ${Number(report.spend_pkr).toLocaleString("en-PK")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {report.cpl ? `PKR ${Number(report.cpl).toLocaleString("en-PK")}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {report.report_url ? (
                        <Link href={report.report_url} target="_blank" className="text-xs font-semibold text-primary underline">
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-primary-mid">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reports.length === 0 && (
              <p className="py-8 text-center text-sm text-primary-mid">No monthly reports yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
