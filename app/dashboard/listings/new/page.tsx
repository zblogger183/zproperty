import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/dashboard/listing-form/ListingForm";

export const metadata: Metadata = {
  title: "Add New Listing | SarZameenz",
};

export default async function AddListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ListingForm />;
}
