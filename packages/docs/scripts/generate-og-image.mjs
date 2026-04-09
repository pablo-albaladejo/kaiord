import sharp from "sharp";
import { statSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, "..");
const publicDir = join(docsRoot, "public");

const BRAND_BG = "#0f172a";
const BRAND_ACCENT = "#0284c7";

function createDocsOgSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND_BG}"/>
  <!-- Logo symbol centered -->
  <g transform="translate(460, 100) scale(2.5)">
    <path d="M20 0L37.32 10L37.32 30L20 40L2.68 30L2.68 10Z" stroke="${BRAND_ACCENT}" stroke-width="2" fill="none"/>
    <circle cx="20" cy="20" r="5" fill="${BRAND_ACCENT}"/>
    <line x1="20" y1="20" x2="20" y2="2" stroke="${BRAND_ACCENT}" stroke-width="1.5" opacity="0.5"/>
    <line x1="20" y1="20" x2="35.6" y2="11" stroke="${BRAND_ACCENT}" stroke-width="1.5" opacity="0.5"/>
    <line x1="20" y1="20" x2="35.6" y2="29" stroke="${BRAND_ACCENT}" stroke-width="1.5" opacity="0.5"/>
    <line x1="20" y1="20" x2="20" y2="38" stroke="${BRAND_ACCENT}" stroke-width="1.5" opacity="0.5"/>
    <line x1="20" y1="20" x2="4.4" y2="29" stroke="${BRAND_ACCENT}" stroke-width="1.5" opacity="0.5"/>
    <line x1="20" y1="20" x2="4.4" y2="11" stroke="${BRAND_ACCENT}" stroke-width="1.5" opacity="0.5"/>
    <circle cx="20" cy="2" r="2.5" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="35.6" cy="11" r="2.5" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="35.6" cy="29" r="2.5" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="20" cy="38" r="2.5" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="4.4" cy="29" r="2.5" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="4.4" cy="11" r="2.5" fill="${BRAND_ACCENT}" opacity="0.7"/>
  </g>
  <!-- Wordmark -->
  <text x="600" y="360" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" letter-spacing="-1" fill="#f8fafc">kaiord</text>
  <!-- Subtitle -->
  <text x="600" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="#cbd5e1">Documentation</text>
  <!-- Author -->
  <text x="600" y="560" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#64748b">by Pablo Albaladejo</text>
</svg>`);
}

async function main() {
  mkdirSync(publicDir, { recursive: true });

  console.log("Generating docs OG image...");
  const svg = createDocsOgSvg();
  const outputPath = join(publicDir, "og-image-docs.png");

  await sharp(svg)
    .resize(1200, 630)
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(outputPath);

  const stats = statSync(outputPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`  og-image-docs.png (${sizeKB}KB)`);

  if (sizeKB > 100) {
    console.warn(`  WARNING: OG image is ${sizeKB}KB, target is < 100KB`);
  }

  console.log("Done!");
}

main().catch(console.error);
