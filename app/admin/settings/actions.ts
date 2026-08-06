"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface SettingsFieldValue {
  key: string;
  value: string | boolean;
}

// Shared by every settings/<category> page (general, notifications,
// payments, email) — they all just upsert a batch of key/value rows into
// the same `settings` table, so one generic action covers all four instead
// of duplicating saveHomepageSettingsAction's body per category. Plans
// isn't included here since it edits subscription_plans rows, not settings.
export async function saveSettingsCategoryAction(category: string, rows: SettingsFieldValue[]) {
  const { admin, user } = await verifyAdmin();

  const payload = rows.map(({ key, value }) => ({
    key,
    value,
    category,
    updated_by: user.id,
  }));

  const { error } = await admin.from("settings").upsert(payload, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/settings/${category}`);

  return { ok: true };
}
