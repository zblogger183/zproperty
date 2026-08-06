import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Bell, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Buyer Dashboard | SarZameenz" };

export default async function BuyerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ count: savedCount }, { count: alertsCount }, { data: profile }] = await Promise.all([
    supabase.from("saved_listings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("property_alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase.from("users").select("name").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Welcome{profile?.name ? `, ${profile.name}` : ""}</h1>
      <p className="mt-1 text-sm text-primary-mid">Your saved listings and alerts.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/buyer/saved" className="rounded-xl border border-primary bg-white p-5 hover:border-secondary">
          <Heart className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 text-2xl font-bold text-black">{savedCount ?? 0}</p>
          <p className="text-xs text-primary-mid">Saved Listings</p>
        </Link>
        <Link href="/buyer/alerts" className="rounded-xl border border-primary bg-white p-5 hover:border-secondary">
          <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 text-2xl font-bold text-black">{alertsCount ?? 0}</p>
          <p className="text-xs text-primary-mid">Active Alerts</p>
        </Link>
        <Link href="/buy/lahore" className="rounded-xl border border-primary bg-white p-5 hover:border-secondary">
          <Search className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-black">Browse Listings</p>
          <p className="text-xs text-primary-mid">Find your next property</p>
        </Link>
      </div>
    </div>
  );
}
