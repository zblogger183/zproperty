"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotificationForAllAdmins } from "@/lib/notifications/inapp";

export async function submitCNICAction(data: {
  cnic_number: string;
  cnic_front_url: string; // storage path (not URL)
  cnic_back_url: string; // storage path (not URL)
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const digits = data.cnic_number.replace(/\D/g, "");
  if (digits.length !== 13) {
    throw new Error("Invalid CNIC number");
  }

  const admin = createAdminClient();

  await admin
    .from("agent_profiles")
    .update({
      cnic_number: data.cnic_number,
      cnic_front_url: data.cnic_front_url,
      cnic_back_url: data.cnic_back_url,
      cnic_verified: false, // reset if re-submitting
    })
    .eq("user_id", user.id);

  await createNotificationForAllAdmins({
    type: "cnic_submitted",
    title: "New CNIC Verification Request",
    body: "An agent has submitted CNIC for verification.",
    data: { agent_user_id: user.id },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
