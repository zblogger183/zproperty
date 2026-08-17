import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm, type SettingsFieldDef } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Email Settings | ZProperty Admin" };

const FIELDS: SettingsFieldDef[] = [
  { key: "email_from_name", label: "From Name", type: "text", placeholder: "ZProperty" },
  { key: "email_from_address", label: "From Address", type: "text", placeholder: "noreply@zproperty.pk" },
  { key: "email_reply_to", label: "Reply-To Address", type: "text", placeholder: "support@zproperty.pk" },
];

const DEFAULTS: Record<string, string | boolean> = {
  email_from_name: "ZProperty",
  email_from_address: "",
  email_reply_to: "",
};

export default async function EmailSettingsPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("key, value").eq("category", "email");
  const existing = new Map((data ?? []).map((row) => [row.key as string, row.value as string | boolean]));

  const missingRows = Object.entries(DEFAULTS)
    .filter(([key]) => !existing.has(key))
    .map(([key, value]) => ({ key, value, category: "email" }));

  if (missingRows.length > 0) {
    await admin.from("settings").upsert(missingRows, { onConflict: "key" });
  }

  const values: Record<string, string | boolean> = { ...DEFAULTS };
  for (const [key, value] of existing) values[key] = value;

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Email Settings</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Sender identity for transactional email. Note: lib/notifications/email.ts sends via Resend with its own
        configured sender today — these values aren&apos;t read by it yet.
      </p>

      <div className="mt-6">
        <SettingsForm category="email" fields={FIELDS} initialValues={values} />
      </div>
    </div>
  );
}
