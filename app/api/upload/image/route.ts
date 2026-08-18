import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getImageType } from "@/lib/image/validateImage";
import { uploadImageToCloudinary } from "@/lib/image/cloudinary";

const ALLOWED_ROLES = new Set(["agent", "developer", "admin", "super_admin"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Real auth check — kept from the Sharp/Supabase-Storage version of this
    // route. An upload endpoint that processes/stores arbitrary files
    // without actually verifying the caller's role is an easy abuse vector
    // (storage/bandwidth cost on the Cloudinary account), so this still uses
    // the cookie-bound server client to verify identity and role before
    // anything gets uploaded.
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !ALLOWED_ROLES.has(profile.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "listings";
    const altText = (formData.get("alt_text") as string) || "";
    const listingId = formData.get("listing_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!getImageType(buffer)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
        { status: 400 },
      );
    }

    const fileId = randomUUID();

    let result;
    try {
      result = await uploadImageToCloudinary(buffer, folder, fileId);
    } catch (uploadError) {
      console.error("[upload/image] Cloudinary upload failed:", uploadError);
      return NextResponse.json({ error: "Could not process image." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: media, error: mediaError } = await admin
      .from("media_library")
      .insert({
        uploaded_by: user.id,
        filename: fileId,
        original_name: file.name,
        url: result.large_url,
        thumb_url: result.thumb_url,
        webp_url: result.large_url,
        file_size_kb: result.original_size_kb,
        width: result.width,
        height: result.height,
        mime_type: "image/webp",
        alt_text: altText,
        folder,
      })
      .select("id")
      .single();

    if (mediaError) {
      console.error("[upload/image] media_library insert failed:", mediaError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (listingId) {
      // Ownership check — without this, the admin client below (which
      // bypasses the listing_images RLS policy that would otherwise enforce
      // this) let any authenticated agent/developer overwrite images on any
      // listing by supplying an arbitrary listing_id.
      const { data: listing } = await admin
        .from("listings")
        .select("agent_id")
        .eq("id", listingId)
        .maybeSingle();

      const isOwner = listing?.agent_id === user.id;
      const isAdmin = profile.role === "admin" || profile.role === "super_admin";

      if (!listing || (!isOwner && !isAdmin)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { count } = await admin
        .from("listing_images")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId);

      await admin.from("listing_images").insert({
        listing_id: listingId,
        thumb_url: result.thumb_url,
        medium_url: result.medium_url,
        large_url: result.large_url,
        og_url: result.og_url,
        original_filename: file.name,
        original_size_kb: result.original_size_kb,
        webp_size_kb: result.webp_size_kb,
        compression_ratio: result.compression_pct,
        width: result.width,
        height: result.height,
        alt_text: altText,
        display_order: count ?? 0,
        is_primary: count === 0, // first image is primary
      });

      if (count === 0) {
        await admin
          .from("listings")
          .update({
            primary_image_url: result.large_url,
            og_image_url: result.og_url,
            image_count: 1,
          })
          .eq("id", listingId);
      } else {
        await admin
          .from("listings")
          .update({ image_count: (count ?? 0) + 1 })
          .eq("id", listingId);
      }
    }

    return NextResponse.json({
      id: media.id,
      thumb_url: result.thumb_url,
      medium_url: result.medium_url,
      large_url: result.large_url,
      og_url: result.og_url,
      original_size_kb: result.original_size_kb,
      webp_size_kb: result.webp_size_kb,
      compression_pct: result.compression_pct,
      width: result.width,
      height: result.height,
      alt_text: altText,
    });
  } catch (error) {
    // Catches anything unexpected that isn't already handled above (a
    // Supabase client throwing instead of returning {error}, a malformed
    // request body, etc.) — turns it into clean JSON instead of a raw
    // platform error page a client's fetch().json() can't parse.
    console.error("[upload/image] unhandled error:", error);
    return NextResponse.json(
      { error: "Upload failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
