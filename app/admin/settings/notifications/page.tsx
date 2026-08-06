import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm, type SettingsFieldDef } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notification Settings | SarZameenz Admin" };

const FIELDS: SettingsFieldDef[] = [
  { key: "notify_new_lead_email", label: "Email agents on new lead", type: "boolean" },
  { key: "notify_listing_approved_email", label: "Email agents when a listing is approved", type: "boolean" },
  { key: "notify_listing_rejected_email", label: "Email agents when a listing is rejected", type: "boolean" },
  { key: "notify_payment_received_email", label: "Email users on payment received", type: "boolean" },
  {
    key: "admin_alert_email",
    label: "Admin Alert Email",
    type: "text",
    placeholder: "alerts@sarzameenz.com",
    helpText: "Where platform-level alerts (e.g. failed payments) are sent.",
  },
];

const DEFAULTS: Record<string, string | boolean> = {
  notify_new_lead_email: true,
  notify_listing_approved_email: true,
  notify_listing_rejected_email: true,
  notify_payment_received_email: true,
  admin_alert_email: "",
};

export default async function NotificationSettingsPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("key, value").eq("category", "notifications");
  const existing = new Map((data ?? []).map((row) => [row.key as string, row.value as string | boolean]));

  const missingRows = Object.entries(DEFAULTS)
    .filter(([key]) => !existing.has(key))
    .map(([key, value]) => ({ key, value, category: "notifications" }));

  if (missingRows.length > 0) {
    await admin.from("settings").upsert(missingRows, { onConflict: "key" });
  }

  const values: Record<string, string | boolean> = { ...DEFAULTS };
  for (const [key, value] of existing) values[key] = value;

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Notification Settings</h1>
      <p className="mt-1 text-sm text-primary-mid">Control which automated notifications the platform sends.</p>

      <div className="mt-6">
        <SettingsForm category="notifications" fields={FIELDS} initialValues={values} />
      </div>
    </div>
  );
}
