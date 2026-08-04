import { mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { buildOgCardSvg } from "../../../scripts/brand-og-card.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

async function main() {
  mkdirSync(publicDir, { recursive: true });

  console.log("Generating editor OG image...");
  const outputPath = join(publicDir, "og-image-editor.png");

  await sharp(buildOgCardSvg({ subtitle: "Editor" }))
    .resize(1200, 630)
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(outputPath);

  const sizeKB = Math.round(statSync(outputPath).size / 1024);
  console.log(`  og-image-editor.png (${sizeKB}KB)`);

  if (sizeKB > 100) {
    console.warn(`  WARNING: OG image is ${sizeKB}KB, target is < 100KB`);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
