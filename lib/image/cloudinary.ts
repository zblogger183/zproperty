import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string,
  fileId: string,
): Promise<CloudinaryResult> {
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const options = {
      public_id: `zproperty/${folder}/${fileId}`,
      resource_type: "image" as const,
      overwrite: false,
      exif: false,
      // Applied to the file BEFORE it's stored, not just on delivery — an
      // agent uploading a straight-off-the-camera 6000x4000, 10MB photo
      // gets that stored as a ~2400px, auto-quality asset instead, with no
      // action needed on their end. Every thumb/medium/large/og URL below
      // is then derived from this already-reasonable source rather than
      // the untouched original, so both Cloudinary storage and the cost of
      // generating those derived sizes shrink accordingly. `crop: "limit"`
      // only ever downsizes — an already-small upload is left alone.
      transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto:good" }],
    };

    cloudinary.uploader
      .upload_stream(options, (error, res) => {
        if (error || !res) reject(error ?? new Error("Cloudinary upload returned no result"));
        else resolve(res);
      })
      .end(buffer);
  });

  const pub = result.public_id;
  const thumbUrl = cloudinary.url(pub, { width: 400, height: 300, crop: "fill", fetch_format: "auto", quality: 70, secure: true });
  const mediumUrl = cloudinary.url(pub, { width: 800, height: 600, crop: "fit", fetch_format: "auto", quality: 75, secure: true });
  const largeUrl = cloudinary.url(pub, { width: 1200, height: 900, crop: "fit", fetch_format: "auto", quality: 80, secure: true });
  const ogUrl = cloudinary.url(pub, { width: 1200, height: 630, crop: "fill", fetch_format: "auto", quality: 85, secure: true });

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
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const options = {
      public_id: `zproperty/${folder}/${fileId}`,
      resource_type: "auto" as const,
      overwrite: false,
    };

    cloudinary.uploader
      .upload_stream(options, (error, res) => {
        if (error || !res) reject(error ?? new Error("Cloudinary upload returned no result"));
        else resolve(res);
      })
      .end(buffer);
  });

  return result.secure_url;
}
