// Uses Node's built-in test runner (node:test) — no jest/vitest is
// configured in this project and none is installed for this task, per the
// "zero new packages" constraint. Run with: node --test lib/image/*.test.mts
//
// Named .test.mts (not .test.ts, as literally requested) so Node's loader
// treats it as ESM unambiguously — a plain .ts file with `import` syntax
// still runs, but only after Node reparses it and prints a
// MODULE_TYPELESS_PACKAGE_JSON warning on every run, since this project's
// package.json has no "type" field (changing that globally to fix a test
// file felt like the wrong tradeoff, given it could affect how Next.js
// treats other non-TS files in the project).
//
// Relative imports need the explicit .ts extension (`./processor.ts`, not
// `./processor`) — Node's ESM resolver, even with type-stripping enabled,
// does not do TypeScript-style extensionless resolution.
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { getImageType, processImage } from "./processor.ts";

test("getImageType detects JPEG from magic bytes", () => {
  const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(getImageType(buffer), "jpeg");
});

test("getImageType detects PNG from magic bytes", () => {
  const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assert.equal(getImageType(buffer), "png");
});

test("getImageType detects WebP from magic bytes", () => {
  // RIFF <4-byte size> WEBP
  const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  assert.equal(getImageType(buffer), "webp");
});

test("getImageType returns null for an unrecognized/invalid file", () => {
  const buffer = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(getImageType(buffer), null);
});

test("getImageType returns null for an empty buffer", () => {
  assert.equal(getImageType(Buffer.alloc(0)), null);
});

test("getImageType does not mistake a JPEG for a WebP or PNG", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.notEqual(getImageType(jpeg), "png");
  assert.notEqual(getImageType(jpeg), "webp");
});

test("processImage generates all four sizes and reports plausible stats", async () => {
  const original = await sharp({
    create: { width: 2000, height: 1500, channels: 3, background: { r: 200, g: 50, b: 50 } },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const uploadedPaths: string[] = [];
  const mockUpload = async (path: string, data: Buffer): Promise<string> => {
    uploadedPaths.push(path);
    return `https://example.supabase.co/storage/v1/object/public/media/${path}?bytes=${data.length}`;
  };

  const result = await processImage(original, "test-file-id", mockUpload);

  assert.equal(uploadedPaths.length, 4);
  assert.ok(uploadedPaths.every((path) => path.startsWith("listings/test-file-id/")));

  assert.ok(result.thumb_url.includes("thumb.webp"));
  assert.ok(result.medium_url.includes("medium.webp"));
  assert.ok(result.large_url.includes("large.webp"));
  assert.ok(result.og_url.includes("og.webp"));

  assert.equal(result.width, 2000);
  assert.equal(result.height, 1500);

  assert.ok(result.original_size_kb > 0);
  assert.ok(result.webp_size_kb > 0);
  // A synthetic solid-color image compresses extremely well — just assert
  // the math produces a sane percentage, not an exact figure.
  assert.ok(result.compression_pct >= 0 && result.compression_pct <= 100);
});

test("processImage never upscales beyond the original's dimensions (withoutEnlargement)", async () => {
  const original = await sharp({
    create: { width: 100, height: 80, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .png()
    .toBuffer();

  const mockUpload = async (path: string, data: Buffer): Promise<string> =>
    `https://example.supabase.co/${path}#${data.length}`;

  const result = await processImage(original, "small-file-id", mockUpload);

  // Original (100x80) is smaller than every target size, so
  // withoutEnlargement should leave it at its native dimensions.
  assert.equal(result.width, 100);
  assert.equal(result.height, 80);
});
