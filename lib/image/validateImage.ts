export type ImageMagicType = "jpeg" | "png" | "webp";

/**
 * Validates file type by magic bytes rather than trusting the client-supplied
 * MIME type header, which is trivially spoofable (e.g. a renamed .exe with a
 * "image/jpeg" Content-Type). Shared by app/api/upload/image and
 * app/api/upload/cnic — split out of the old lib/image/processor.ts (which
 * also held the now-removed Sharp-based resize pipeline) so the CNIC route
 * doesn't depend on anything Cloudinary-specific.
 */
export function getImageType(buffer: Buffer): ImageMagicType | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e) return "png";
  if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42) return "webp";
  return null;
}

// Same magic-bytes-not-MIME-type rationale as getImageType above — used by
// the society map PDF upload route.
export function isPdf(buffer: Buffer): boolean {
  return (
    buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
  );
}
