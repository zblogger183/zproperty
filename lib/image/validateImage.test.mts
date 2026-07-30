// Uses Node's built-in test runner (node:test) — no jest/vitest is
// configured in this project, per the "zero new packages" constraint.
// Run with: node --test lib/image/*.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getImageType } from "./validateImage.ts";

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
