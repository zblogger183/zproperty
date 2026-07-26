import sharp from "sharp";

export interface ProcessedImage {
  thumb_url: string; // 400×300, q70, cover
  medium_url: string; // 800×600, q75, inside
  large_url: string; // 1200×900, q80, inside
  og_url: string; // 1200×630, q85, cover
  original_size_kb: number;
  webp_size_kb: number;
  compression_pct: number;
  width: number;
  height: number;
}

interface SizeSpec {
  name: "thumb" | "medium" | "large" | "og";
  w: number;
  h: number;
  fit: "cover" | "inside";
  q: number;
}

const SIZES: SizeSpec[] = [
  { name: "thumb", w: 400, h: 300, fit: "cover", q: 70 },
  { name: "medium", w: 800, h: 600, fit: "inside", q: 75 },
  { name: "large", w: 1200, h: 900, fit: "inside", q: 80 },
  { name: "og", w: 1200, h: 630, fit: "cover", q: 85 },
];

export async function processImage(
  buffer: Buffer,
  fileId: string,
  supabaseStorageUpload: (path: string, data: Buffer) => Promise<string>,
): Promise<ProcessedImage> {
  // 1. Get original metadata
  const meta = await sharp(buffer).metadata();
  const originalSizeKb = Math.round(buffer.length / 1024);

  // 2. Process all sizes concurrently
  const results = await Promise.all(
    SIZES.map(async (size) => {
      const processed = await sharp(buffer)
        .rotate() // auto-rotate from EXIF
        .resize(size.w, size.h, {
          fit: size.fit,
          withoutEnlargement: true, // never upscale
        })
        .webp({ quality: size.q })
        .toBuffer();

      const path = `listings/${fileId}/${size.name}.webp`;
      const url = await supabaseStorageUpload(path, processed);
      return { name: size.name, url, sizeKb: Math.round(processed.length / 1024) };
    }),
  );

  const urlMap = Object.fromEntries(results.map((r) => [r.name, r.url])) as Record<
    SizeSpec["name"],
    string
  >;
  const totalKb = results.reduce((sum, r) => sum + r.sizeKb, 0);
  const avgKb = Math.round(totalKb / results.length);

  return {
    thumb_url: urlMap.thumb,
    medium_url: urlMap.medium,
    large_url: urlMap.large,
    og_url: urlMap.og,
    original_size_kb: originalSizeKb,
    webp_size_kb: avgKb,
    compression_pct: Math.round((1 - avgKb / originalSizeKb) * 100),
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

export type ImageMagicType = "jpeg" | "png" | "webp";

/**
 * Validates file type by magic bytes rather than trusting the client-supplied
 * MIME type header, which is trivially spoofable (e.g. a renamed .exe with a
 * "image/jpeg" Content-Type). Exported (rather than kept private in the
 * upload route) so it's directly unit-testable — see processor.test.mts.
 */
export function getImageType(buffer: Buffer): ImageMagicType | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e) return "png";
  if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42) return "webp";
  return null;
}
