import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CNICVerificationQueueClient } from "@/components/admin/CNICVerificationQueueClient";
import type { CNICVerificationAgent } from "@/components/admin/CNICVerificationCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "CNIC Verification Queue | SarZameenz Admin" };

interface PendingProfile {
  user_id: string;
  cnic_number: string;
  cnic_front_url: string | null;
  cnic_back_url: string | null;
  updated_at: string;
  subscription_tier: string;
}

export default async function VerificationQueuePage() {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("agent_profiles")
    .select("user_id, cnic_number, cnic_front_url, cnic_back_url, cnic_verified, created_at, updated_at, subscription_tier")
    .not("cnic_number", "is", null)
    .not("cnic_front_url", "is", null)
    .eq("cnic_verified", false)
    .order("updated_at", { ascending: true });

  const pendingProfiles = (pending ?? []) as unknown as PendingProfile[];

  const [{ data: users }, signedUrlEntries] = await Promise.all([
    pendingProfiles.length > 0
      ? admin
          .from("users")
          .select("id, name, email")
          .in(
            "id",
            pendingProfiles.map((p) => p.user_id),
          )
      : Promise.resolve({ data: [] }),
    Promise.all(
      pendingProfiles.map(async (profile) => {
        const [front, back] = await Promise.all([
          profile.cnic_front_url
            ? admin.storage.from("private-documents").createSignedUrl(profile.cnic_front_url, 600)
            : Promise.resolve(null),
          profile.cnic_back_url
            ? admin.storage.from("private-documents").createSignedUrl(profile.cnic_back_url, 600)
            : Promise.resolve(null),
        ]);
        return {
          user_id: profile.user_id,
          front_url: front?.data?.signedUrl ?? null,
          back_url: back?.data?.signedUrl ?? null,
        };
      }),
    ),
  ]);

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const signedUrlsById = new Map(signedUrlEntries.map((entry) => [entry.user_id, entry]));

  const agents: CNICVerificationAgent[] = pendingProfiles.map((profile) => {
    const user = usersById.get(profile.user_id);
    const signed = signedUrlsById.get(profile.user_id);
    return {
      user_id: profile.user_id,
      cnic_number: profile.cnic_number,
      updated_at: profile.updated_at,
      subscription_tier: profile.subscription_tier,
      name: user?.name ?? "Unknown agent",
      email: user?.email ?? "—",
      front_url: signed?.front_url ?? null,
      back_url: signed?.back_url ?? null,
    };
  });

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">CNIC Verification Queue</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
          {agents.length} pending
        </span>
      </div>

      <CNICVerificationQueueClient initialAgents={agents} />
    </div>
  );
}
