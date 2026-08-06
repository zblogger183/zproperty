import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm, type SettingsFieldDef } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payment Settings | SarZameenz Admin" };

const FIELDS: SettingsFieldDef[] = [
  { key: "jazzcash_sandbox", label: "JazzCash Sandbox Mode", type: "boolean" },
  { key: "easypaisa_sandbox", label: "EasyPaisa Sandbox Mode", type: "boolean" },
  { key: "bank_name", label: "Bank Name", type: "text" },
  { key: "bank_account_title", label: "Account Title", type: "text" },
  { key: "bank_account_number", label: "Account Number", type: "text" },
  { key: "bank_iban", label: "IBAN", type: "text" },
];

const DEFAULTS: Record<string, string | boolean> = {
  jazzcash_sandbox: true,
  easypaisa_sandbox: true,
  bank_name: "",
  bank_account_title: "",
  bank_account_number: "",
  bank_iban: "",
};

export default async function PaymentSettingsPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("key, value").eq("category", "payments");
  const existing = new Map((data ?? []).map((row) => [row.key as string, row.value as string | boolean]));

  const missingRows = Object.entries(DEFAULTS)
    .filter(([key]) => !existing.has(key))
    .map(([key, value]) => ({ key, value, category: "payments" }));

  if (missingRows.length > 0) {
    await admin.from("settings").upsert(missingRows, { onConflict: "key" });
  }

  const values: Record<string, string | boolean> = { ...DEFAULTS };
  for (const [key, value] of existing) values[key] = value;

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Payment Settings</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Gateway modes and the bank account shown to agents for manual bank transfers. Note: the subscription
        checkout page currently displays a hardcoded bank account rather than reading these values — see
        components/dashboard/subscription/SubscriptionClient.tsx.
      </p>

      <div className="mt-6">
        <SettingsForm category="payments" fields={FIELDS} initialValues={values} />
      </div>
    </div>
  );
}
