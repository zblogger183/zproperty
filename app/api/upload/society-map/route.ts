import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPdf } from "@/lib/image/validateImage";
import { uploadPdfToCloudinary } from "@/lib/image/cloudinary";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — master-plan scans run larger than listing photos

export async function POST(request: NextRequest) {
  try {
    // Admin-only: this uploads the shared map on a society's public page,
    // not a per-user asset an agent should be able to touch.
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();

    if (!profile || !ADMIN_ROLES.has(profile.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 20MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isPdf(buffer)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF is allowed." }, { status: 400 });
    }

    let url: string;
    try {
      url = await uploadPdfToCloudinary(buffer, "society-maps", randomUUID());
    } catch (uploadError) {
      console.error("[upload/society-map] Cloudinary upload failed:", uploadError);
      return NextResponse.json({ error: "Could not upload file." }, { status: 400 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload/society-map] unhandled error:", error);
    return NextResponse.json(
      { error: "Upload failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
