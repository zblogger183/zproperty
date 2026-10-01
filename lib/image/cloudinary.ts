// Deliberately has zero dependency on the `cloudinary` npm package — every
// call here is either a signed REST upload over `fetch()` or a hand-built
// delivery URL, both using only standard Web APIs (fetch, FormData, Web
// Crypto). Two reasons: (1) the SDK's `uploader.upload_stream()` sends
// files over a raw Node `https` socket/stream, unavailable on Cloudflare
// Workers (or any runtime without Node's http/https/net modules) — only
// `fetch()` works there; (2) even just importing the SDK for its `.url()`
// helper (pure, deterministic string templating — verified byte-for-byte
// identical output in both forms, minus an SDK usage-analytics query param
// this intentionally omits) added ~95KB gzipped to the Worker bundle for
// zero functional benefit, real weight on a free-tier 3MB budget.

export interface CloudinaryResult {
  thumb_url: string;
  medium_url: string;
  large_url: string;
  og_url: string;
  public_id: string;
  original_size_kb: number;
  webp_size_kb: number;
  compression_pct: number;
  width: number;
  height: number;
}

interface CloudinaryUploadApiResponse {
  public_id: string;
  secure_url: string;
  bytes?: number;
  width: number;
  height: number;
}

function cloudinaryDeliveryUrl(
  publicId: string,
  opts: { width: number; height: number; crop: string; quality: number },
): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  // Matches the exact param order/format the `cloudinary` SDK's own `.url()`
  // produces (short-code params sorted alphabetically: c, f, h, q, w) — and
  // the literal "v1" (not a real asset version number) the SDK falls back
  // to when no `version` is passed, same as every call site here already did.
  const transform = `c_${opts.crop},f_auto,h_${opts.height},q_${opts.quality},w_${opts.width}`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/v1/${publicId}`;
}

// Signing rule (Cloudinary's own docs): every param except `file`,
// `cloud_name`, `resource_type`, `api_key` and `signature` itself gets
// sorted alphabetically, joined as `key=value&key=value...`, the API secret
// appended with no separator, then SHA-1-hashed to hex. Verified against
// Cloudinary's own published worked example before use (byte-identical
// signature for their sample params/secret).
async function signCloudinaryParams(params: Record<string, string>, apiSecret: string): Promise<string> {
  const toSign =
    Object.keys(params)
      .filter((key) => params[key] !== "")
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&") + apiSecret;

  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function cloudinaryUpload(
  buffer: Buffer,
  resourceType: "image" | "auto",
  signedParams: Record<string, string>,
): Promise<CloudinaryUploadApiResponse> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { ...signedParams, timestamp };
  const signature = await signCloudinaryParams(params, apiSecret);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]));
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${await res.text()}`);
  }

  return res.json() as Promise<CloudinaryUploadApiResponse>;
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string,
  fileId: string,
): Promise<CloudinaryResult> {
  const result = await cloudinaryUpload(buffer, "image", {
    public_id: `zproperty/${folder}/${fileId}`,
    overwrite: "false",
    // Applied to the file BEFORE it's stored, not just on delivery — an
    // agent uploading a straight-off-the-camera 6000x4000, 10MB photo gets
    // that stored as a ~2400px, auto-quality asset instead, with no action
    // needed on their end. Every thumb/medium/large/og URL below is then
    // derived from this already-reasonable source rather than the
    // untouched original, so both Cloudinary storage and the cost of
    // generating those derived sizes shrink accordingly. `c_limit` only
    // ever downsizes — an already-small upload is left alone.
    transformation: "w_2400,h_2400,c_limit,q_auto:good",
  });

  const pub = result.public_id;
  const thumbUrl = cloudinaryDeliveryUrl(pub, { width: 400, height: 300, crop: "fill", quality: 70 });
  const mediumUrl = cloudinaryDeliveryUrl(pub, { width: 800, height: 600, crop: "fit", quality: 75 });
  const largeUrl = cloudinaryDeliveryUrl(pub, { width: 1200, height: 900, crop: "fit", quality: 80 });
  const ogUrl = cloudinaryDeliveryUrl(pub, { width: 1200, height: 630, crop: "fill", quality: 85 });

  const originalKb = Math.round(buffer.length / 1024);
  const cloudinaryKb = Math.round((result.bytes ?? buffer.length) / 1024);

  return {
    thumb_url: thumbUrl,
    medium_url: mediumUrl,
    large_url: largeUrl,
    og_url: ogUrl,
    public_id: pub,
    original_size_kb: originalKb,
    webp_size_kb: cloudinaryKb,
    compression_pct: originalKb > 0 ? Math.max(0, Math.round((1 - cloudinaryKb / originalKb) * 100)) : 0,
    width: result.width,
    height: result.height,
  };
}

// Society map PDFs (master-plan downloads) — stored as-is, no derived
// sizes/transformations needed the way listing photos get. `resource_type:
// "auto"` lets Cloudinary store and deliver the PDF directly rather than
// trying to treat it as an image.
export async function uploadPdfToCloudinary(buffer: Buffer, folder: string, fileId: string): Promise<string> {
  const result = await cloudinaryUpload(buffer, "auto", {
    public_id: `zproperty/${folder}/${fileId}`,
    overwrite: "false",
  });

  return result.secure_url;
}
