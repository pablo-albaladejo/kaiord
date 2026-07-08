import sharp from "sharp";
import { statSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const editorRoot = join(__dirname, "..");
const publicDir = join(editorRoot, "public");

// Read a brand token straight from the shared source of truth so the OG card
// stays in lockstep with the landing and docs surfaces.
const BRAND_TOKENS_PATH = resolve(
  editorRoot,
  "..",
  "..",
  "styles",
  "brand-tokens.css"
);

function readBrandTokenColor(name) {
  const source = readFileSync(BRAND_TOKENS_PATH, "utf8");
  const pattern = new RegExp(
    `${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*([^;]+?)\\s*(?:;|\\n)`
  );
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Brand token ${name} not found in ${BRAND_TOKENS_PATH}`);
  }
  return match[1].trim();
}

const BRAND_BG = readBrandTokenColor("--brand-bg-primary");
const BRAND_ACCENT = readBrandTokenColor("--brand-accent-blue");
const ACCENT_SKY = "#38bdf8"; // sky-400 — matches the landing OG subtitle accent

function createEditorOgSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="600" cy="205" r="430">
      <stop offset="0%" stop-color="${BRAND_ACCENT}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${BRAND_ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${BRAND_BG}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
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
  <text x="600" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="500" fill="${ACCENT_SKY}">Editor</text>
  <!-- Author -->
  <text x="600" y="560" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#64748b">by Pablo Albaladejo</text>
</svg>`);
}

async function main() {
  mkdirSync(publicDir, { recursive: true });

  console.log("Generating editor OG image...");
  const svg = createEditorOgSvg();
  const outputPath = join(publicDir, "og-image-editor.png");

  await sharp(svg)
    .resize(1200, 630)
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(outputPath);

  const stats = statSync(outputPath);
  const sizeKB = Math.round(stats.size / 1024);
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
