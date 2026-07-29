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

export type ImageMagicType = "jpeg" | "png" | "webp";

const CONTENT_TYPE_BY_MAGIC_TYPE: Record<ImageMagicType, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// A named async function (rather than inlining `(await import("sharp")).default`
// at the call site) so its return type can be referenced via
// `Awaited<ReturnType<typeof loadSharp>>` — `sharp`'s `export =` (CJS) style
// means `typeof import("sharp")` describes the whole module namespace, not
// the callable default export actually used below.
async function loadSharp() {
  const mod = await import("sharp");
  return mod.default;
}

export async function processImage(
  buffer: Buffer,
  fileId: string,
  uploadFn: (path: string, data: Buffer, contentType?: string) => Promise<string>,
): Promise<ProcessedImage> {
  // Sharp ships a platform-specific native binary as an optional dependency
  // (@img/sharp-<platform>-<arch>) — imported dynamically, inside this
  // try/catch, specifically so a missing/mismatched binary on whatever
  // platform this actually runs on is *catchable* here. A static top-level
  // `import sharp from "sharp"` fails at module-evaluation time, before this
  // function (or any try/catch inside app/api/upload/image/route.ts) ever
  // runs, so it can't be recovered from — only a dynamic import can be.
  let sharp: Awaited<ReturnType<typeof loadSharp>>;
  try {
    sharp = await loadSharp();
  } catch (sharpLoadError) {
    console.warn(
      "[image/processor] sharp unavailable, uploading original without processing:",
      sharpLoadError,
    );
    return uploadOriginalWithoutProcessing(buffer, fileId, uploadFn);
  }

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
      const url = await uploadFn(path, processed, "image/webp");
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

// Upload compression is a nice-to-have; the upload succeeding at all is
// required. If sharp's native binary can't load, every size slot gets the
// same untouched original instead of a resized/re-encoded one — degraded,
// but never a hard failure. The original's real magic-byte type is used for
// the extension and Content-Type (not a hardcoded .jpg/image/webp) since the
// upload route also accepts PNG and WebP uploads, not just JPEG.
async function uploadOriginalWithoutProcessing(
  buffer: Buffer,
  fileId: string,
  uploadFn: (path: string, data: Buffer, contentType?: string) => Promise<string>,
): Promise<ProcessedImage> {
  const imgType = getImageType(buffer) ?? "jpeg";
  const extension = imgType === "jpeg" ? "jpg" : imgType;
  const contentType = CONTENT_TYPE_BY_MAGIC_TYPE[imgType];

  const url = await uploadFn(`listings/${fileId}/original.${extension}`, buffer, contentType);
  const originalSizeKb = Math.round(buffer.length / 1024);

  return {
    thumb_url: url,
    medium_url: url,
    large_url: url,
    og_url: url,
    original_size_kb: originalSizeKb,
    webp_size_kb: originalSizeKb,
    compression_pct: 0,
    width: 0,
    height: 0,
  };
}

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
