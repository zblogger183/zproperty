"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface DmClientInput {
  business_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  service_type: string;
  package_name: string;
  monthly_fee: number;
}

export async function addDmClientAction(input: DmClientInput) {
  const { admin } = await verifyAdmin();

  const { data, error } = await admin
    .from("dm_clients")
    .insert({
      business_name: input.business_name,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      contact_email: input.contact_email,
      service_type: input.service_type,
      package_name: input.package_name,
      monthly_fee: input.monthly_fee,
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add client.");

  revalidatePath("/admin/marketing/clients");

  return data;
}

export async function updateDmClientStatusAction(clientId: string, status: "active" | "paused" | "cancelled") {
  const { admin } = await verifyAdmin();

  await admin.from("dm_clients").update({ status }).eq("id", clientId);

  revalidatePath("/admin/marketing/clients");
  revalidatePath(`/admin/marketing/${clientId}`);

  return { ok: true };
}

export interface MonthlyReportInput {
  month: string;
  leads_count: number;
  spend_pkr: number;
  report_url: string;
  notes: string;
}

export async function addMonthlyReportAction(clientId: string, input: MonthlyReportInput) {
  const { admin } = await verifyAdmin();

  const cpl = input.leads_count > 0 ? input.spend_pkr / input.leads_count : null;

  const { error } = await admin.from("dm_monthly_reports").insert({
    client_id: clientId,
    month: input.month,
    leads_count: input.leads_count,
    spend_pkr: input.spend_pkr,
    cpl,
    report_url: input.report_url || null,
    notes: input.notes || null,
    sent_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/marketing/${clientId}`);

  return { ok: true };
}
