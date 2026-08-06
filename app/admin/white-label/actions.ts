"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface WhiteLabelInput {
  agency_id: string;
  domain: string;
  site_title: string;
  monthly_fee_pkr: number;
  setup_fee_pkr: number;
}

export async function addWhiteLabelClientAction(input: WhiteLabelInput) {
  const { admin } = await verifyAdmin();

  const { data, error } = await admin
    .from("white_label_clients")
    .insert({
      agency_id: input.agency_id,
      domain: input.domain,
      site_title: input.site_title,
      monthly_fee_pkr: input.monthly_fee_pkr,
      setup_fee_pkr: input.setup_fee_pkr,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add white-label client.");

  revalidatePath("/admin/white-label");

  return data;
}

export async function toggleWhiteLabelActiveAction(id: string, isActive: boolean) {
  const { admin } = await verifyAdmin();

  await admin.from("white_label_clients").update({ is_active: isActive }).eq("id", id);

  revalidatePath("/admin/white-label");

  return { ok: true };
}
