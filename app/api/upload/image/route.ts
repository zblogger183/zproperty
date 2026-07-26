import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getImageType, processImage } from "@/lib/image/processor";

const ALLOWED_ROLES = new Set(["agent", "developer", "admin", "super_admin"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  // Real auth check — the given spec called for "must be logged in
  // agent/developer/admin" but only left a comment where the check should
  // go. An upload endpoint that processes/stores arbitrary files without
  // actually verifying the caller is an easy abuse vector (storage/CPU
  // cost), so this uses the cookie-bound server client to verify identity
  // and role before touching the admin client for the actual writes.
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

  const imgType = getImageType(buffer);
  if (!imgType) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const fileId = randomUUID();

  async function uploadToStorage(path: string, data: Buffer): Promise<string> {
    const { error } = await supabase.storage.from("media").upload(path, data, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(path);
    return publicUrl;
  }

  let processed;
  try {
    processed = await processImage(buffer, fileId, uploadToStorage);
  } catch {
    // Magic bytes can pass while the body is still corrupt/truncated —
    // sharp throws in that case, so this turns that into a clean 400
    // instead of an unhandled 500.
    return NextResponse.json({ error: "Could not process image." }, { status: 400 });
  }

  const { data: media, error: mediaError } = await supabase
    .from("media_library")
    .insert({
      filename: fileId,
      original_name: file.name,
      url: processed.large_url,
      thumb_url: processed.thumb_url,
      webp_url: processed.large_url,
      file_size_kb: processed.original_size_kb,
      width: processed.width,
      height: processed.height,
      mime_type: "image/webp",
      alt_text: altText,
      folder,
    })
    .select("id")
    .single();

  if (mediaError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (listingId) {
    const { count } = await supabase
      .from("listing_images")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId);

    await supabase.from("listing_images").insert({
      listing_id: listingId,
      thumb_url: processed.thumb_url,
      medium_url: processed.medium_url,
      large_url: processed.large_url,
      og_url: processed.og_url,
      original_filename: file.name,
      original_size_kb: processed.original_size_kb,
      webp_size_kb: processed.webp_size_kb,
      compression_ratio: processed.compression_pct,
      width: processed.width,
      height: processed.height,
      alt_text: altText,
      display_order: count ?? 0,
      is_primary: count === 0, // first image is primary
    });

    if (count === 0) {
      await supabase
        .from("listings")
        .update({
          primary_image_url: processed.large_url,
          og_image_url: processed.og_url,
          image_count: 1,
        })
        .eq("id", listingId);
    } else {
      await supabase
        .from("listings")
        .update({ image_count: (count ?? 0) + 1 })
        .eq("id", listingId);
    }
  }

  return NextResponse.json({
    id: media.id,
    thumb_url: processed.thumb_url,
    medium_url: processed.medium_url,
    large_url: processed.large_url,
    og_url: processed.og_url,
    original_size_kb: processed.original_size_kb,
    webp_size_kb: processed.webp_size_kb,
    compression_pct: processed.compression_pct,
    width: processed.width,
    height: processed.height,
    alt_text: altText,
  });
}
