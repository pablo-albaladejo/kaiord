import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const assets = join(root, "assets");

const BRAND_BG = "#0f172a";
const BRAND_ACCENT = "#0284c7";

function createFaviconSvg(size) {
  const s = size;
  const r = Math.round(s * 0.15);
  const scale = s / 48;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${r}" fill="${BRAND_BG}"/>
  <g transform="translate(${s * 0.15}, ${s * 0.15}) scale(${scale * 0.7})">
    <path d="M20 0L37.32 10L37.32 30L20 40L2.68 30L2.68 10Z" stroke="${BRAND_ACCENT}" stroke-width="2.5" fill="none"/>
    <circle cx="20" cy="20" r="6" fill="${BRAND_ACCENT}"/>
    <line x1="20" y1="20" x2="20" y2="2" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="35.6" y2="11" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="35.6" y2="29" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="20" y2="38" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="4.4" y2="29" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="4.4" y2="11" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.5"/>
    <circle cx="20" cy="2" r="3" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="35.6" cy="11" r="3" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="35.6" cy="29" r="3" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="20" cy="38" r="3" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="4.4" cy="29" r="3" fill="${BRAND_ACCENT}" opacity="0.7"/>
    <circle cx="4.4" cy="11" r="3" fill="${BRAND_ACCENT}" opacity="0.7"/>
  </g>
</svg>`);
}

function createOgSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND_BG}"/>
  <!-- Logo symbol centered -->
  <g transform="translate(460, 120) scale(2.5)">
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
  <text x="600" y="380" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" letter-spacing="-1" fill="#f8fafc">kaiord</text>
  <!-- Tagline -->
  <text x="600" y="440" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#cbd5e1">One framework. Every fitness format.</text>
  <!-- Author -->
  <text x="600" y="560" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#64748b">by Pablo Albaladejo</text>
</svg>`);
}

async function main() {
  mkdirSync(assets, { recursive: true });

  console.log("Generating favicon PNGs...");
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  for (const size of sizes) {
    const svg = createFaviconSvg(size);
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    pngBuffers.push(png);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(assets, `favicon-${size}.png`));
    console.log(`  favicon-${size}.png`);
  }

  console.log("Generating favicon.ico...");
  // ICO format: simple concatenation approach using 32px PNG as .ico
  // Modern browsers prefer SVG favicon, ICO is fallback
  await sharp(createFaviconSvg(32))
    .resize(32, 32)
    .png()
    .toFile(join(assets, "favicon.png"));
  // Use 32px PNG as the primary favicon (SVG favicon is preferred in HTML)
  console.log("  favicon.png (32px, used as fallback)");

  console.log("Generating apple-touch-icon.png...");
  await sharp(createFaviconSvg(180))
    .resize(180, 180)
    .png()
    .toFile(join(assets, "apple-touch-icon.png"));
  console.log("  apple-touch-icon.png (180px)");

  console.log("Generating og-image.png...");
  await sharp(createOgSvg())
    .resize(1200, 630)
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(join(assets, "og-image.png"));
  const ogStats = readFileSync(join(assets, "og-image.png"));
  console.log(`  og-image.png (${Math.round(ogStats.length / 1024)}KB)`);

  console.log("Done!");
}

main().catch(console.error);
