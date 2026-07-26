import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getImageType } from "@/lib/image/processor";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
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

  const admin = createAdminClient();
  const extension = imgType === "jpeg" ? "jpg" : "png";
  const path = `cnic/${user.id}/${side}-${Date.now()}.${extension}`;

  // No Sharp processing — CNIC images are kept at original quality/
  // resolution for manual review and any future OCR, unlike the
  // web-optimized derivatives lib/image/processor.ts generates for listing
  // photos.
  const { error: uploadError } = await admin.storage.from("private-documents").upload(path, buffer, {
    contentType: imgType === "jpeg" ? "image/jpeg" : "image/png",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  // Not returned to the client — this call only confirms the object is
  // actually readable back out of the bucket right after upload. The
  // permanent, public-facing response is the storage path only; admins
  // generate their own short-lived signed URL when reviewing (see
  // app/admin/users/verification/page.tsx).
  const { error: signError } = await admin.storage.from("private-documents").createSignedUrl(path, 60);
  if (signError) {
    return NextResponse.json({ error: "Upload verification failed." }, { status: 500 });
  }

  return NextResponse.json({ path });
}
