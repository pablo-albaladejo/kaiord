import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "assets", "favicon.svg");
const outDir = join(root, "packages", "garmin-bridge", "icons");

const SIZES = [16, 48, 128];

const svg = readFileSync(svgPath, "utf8");
mkdirSync(outDir, { recursive: true });

for (const size of SIZES) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  const rendered = resvg.render();
  writeFileSync(join(outDir, `icon${size}.png`), rendered.asPng());
  console.log(`  icon${size}.png (${size}x${size})`);
}

console.log(`Done! Icons written to packages/garmin-bridge/icons/`);
