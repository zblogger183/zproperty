// One-off setup script — run manually ONCE (`node scripts/create-placeholder-icons.js`)
// to seed public/icons/ with valid placeholder PNGs so the manifest validates.
// Replace these with real branded icons before launch. Not run at build time.
const fs = require("fs");
const path = require("path");

// 1x1 transparent PNG
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, "..", "public", "icons");

fs.mkdirSync(outDir, { recursive: true });

for (const size of SIZES) {
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, PLACEHOLDER_PNG);
  console.log(`Created ${filePath}`);
}
