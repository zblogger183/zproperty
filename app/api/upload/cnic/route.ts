import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getImageType } from "@/lib/image/processor";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  // The upload itself goes through this cookie-bound session client, not the
  // service-role admin client — it runs as the actual user, scoped by
  // storage.objects RLS (supabase/migrations/010_storage_policies.sql)
  // rather than bypassing it. This also means the object gets correctly
  // attributed (storage.objects.owner = auth.uid()) instead of every CNIC
  // file uploaded via the old admin client having no real owner at all.
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const side = formData.get("side") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (side !== "front" && side !== "back") {
    return NextResponse.json({ error: "side must be 'front' or 'back'" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const imgType = getImageType(buffer);
  if (imgType !== "jpeg" && imgType !== "png") {
    return NextResponse.json({ error: "Invalid file type. Only JPG and PNG are allowed." }, { status: 400 });
  }

  const extension = imgType === "jpeg" ? "jpg" : "png";
  const path = `cnic/${user.id}/${side}-${Date.now()}.${extension}`;

  // No Sharp processing — CNIC images are kept at original quality/
  // resolution for manual review and any future OCR, unlike the
  // web-optimized derivatives lib/image/processor.ts generates for listing
  // photos.
  const { error: uploadError } = await authClient.storage.from("private-documents").upload(path, buffer, {
    contentType: imgType === "jpeg" ? "image/jpeg" : "image/png",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  // Deliberately still the admin client, not authClient: this is a one-off
  // internal integrity check (confirms the object is actually readable back
  // out of the bucket right after upload), never exposed to the client
  // response. It must not go through the uploading user's own session —
  // storage.objects' SELECT policy on this bucket only grants read access to
  // admins/super_admins (see migration 010), so a regular agent's own session
  // would be denied here even though their own upload just above succeeded.
  // The permanent, public-facing response is the storage path only; admins
  // generate their own short-lived signed URL when reviewing (see
  // app/admin/users/verification/page.tsx).
  const admin = createAdminClient();
  const { error: signError } = await admin.storage.from("private-documents").createSignedUrl(path, 60);
  if (signError) {
    return NextResponse.json({ error: "Upload verification failed." }, { status: 500 });
  }

  return NextResponse.json({ path });
}
