import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm, type SettingsFieldDef } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "General Settings | ZProperty Admin" };

const FIELDS: SettingsFieldDef[] = [
  { key: "site_name", label: "Site Name", type: "text" },
  { key: "site_tagline", label: "Tagline", type: "text" },
  { key: "contact_email", label: "Contact Email", type: "text" },
  { key: "contact_phone", label: "Contact Phone", type: "text" },
  { key: "whatsapp_number", label: "WhatsApp Number", type: "text", placeholder: "923001234567" },
  {
    key: "maintenance_mode",
    label: "Maintenance Mode",
    type: "boolean",
    helpText: "When on, the public site should show a maintenance page (enforcement not yet wired into proxy.ts).",
  },
];

export default async function GeneralSettingsPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("key, value").eq("category", "general");
  const values: Record<string, string | boolean> = {};
  for (const row of data ?? []) {
    values[row.key as string] = row.value as string | boolean;
  }

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">General Settings</h1>
      <p className="mt-1 text-sm text-primary-mid">Platform-wide general settings.</p>

      <div className="mt-6">
        <SettingsForm category="general" fields={FIELDS} initialValues={values} />
      </div>
    </div>
  );
}
