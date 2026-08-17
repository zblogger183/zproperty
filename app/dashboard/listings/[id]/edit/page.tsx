import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditListingForm, type EditableListing } from "@/components/dashboard/listing-form/EditListingForm";
import type { UploadedImage } from "@/types";

export const dynamic = "force-dynamic";

const LISTING_COLUMNS =
  "id, agent_id, status, reject_reason, purpose, type, title, description, price, is_negotiable, " +
  "city_id, area_id, society_id, phase_id, block_id, plot_number, address, lat, lng, area_sqft, " +
  "area_marla, beds, baths, floors, " +
  "floor_number, parking_spaces, age_years, furnished_status, features, video_url, " +
  "contact_phone, contact_whatsapp";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: listingRaw }, { data: imagesRaw }] = await Promise.all([
    admin.from("listings").select(LISTING_COLUMNS).eq("id", id).single(),
    admin
      .from("listing_images")
      .select("id, thumb_url, medium_url, large_url, og_url, alt_text, display_order, is_primary")
      .eq("listing_id", id)
      .order("display_order", { ascending: true }),
  ]);

  if (!listingRaw) redirect("/dashboard/listings");

  const listing = listingRaw as unknown as EditableListing & { agent_id: string };
  if (listing.agent_id !== user.id) redirect("/dashboard/listings");

  const images = (imagesRaw ?? []) as unknown as UploadedImage[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <EditListingForm listing={listing} initialImages={images} />
    </div>
  );
}
