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
