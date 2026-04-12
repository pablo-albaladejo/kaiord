import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "packages", "garmin-bridge", "dist");
mkdirSync(outDir, { recursive: true });

const BG = "#0f172a";
const ACCENT = "#0284c7";
const TEXT = "#f8fafc";
const MUTED = "#94a3b8";
const SURFACE = "#1e293b";

const hexagonSymbol = (cx, cy, scale) => `
  <g transform="translate(${cx - 20 * scale}, ${cy - 20 * scale}) scale(${scale})">
    <path d="M20 0L37.32 10L37.32 30L20 40L2.68 30L2.68 10Z" stroke="${ACCENT}" stroke-width="2.5" fill="none"/>
    <circle cx="20" cy="20" r="6" fill="${ACCENT}"/>
    <line x1="20" y1="20" x2="20" y2="2" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="35.6" y2="11" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="35.6" y2="29" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="20" y2="38" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="4.4" y2="29" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
    <line x1="20" y1="20" x2="4.4" y2="11" stroke="${ACCENT}" stroke-width="2" opacity="0.5"/>
    <circle cx="20" cy="2" r="3" fill="${ACCENT}" opacity="0.7"/>
    <circle cx="35.6" cy="11" r="3" fill="${ACCENT}" opacity="0.7"/>
    <circle cx="35.6" cy="29" r="3" fill="${ACCENT}" opacity="0.7"/>
    <circle cx="20" cy="38" r="3" fill="${ACCENT}" opacity="0.7"/>
    <circle cx="4.4" cy="29" r="3" fill="${ACCENT}" opacity="0.7"/>
    <circle cx="4.4" cy="11" r="3" fill="${ACCENT}" opacity="0.7"/>
  </g>`;

const popupMockup = (x, y, w, h, connected) => {
  const status = connected
    ? { bg: "#166534", text: "Connected to Garmin Connect" }
    : { bg: "#991b1b", text: "Not connected" };
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${SURFACE}" stroke="#334155" stroke-width="1"/>
    <text x="${x + w / 2}" y="${y + 28}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="${TEXT}">Kaiord Garmin Bridge</text>
    <rect x="${x + 16}" y="${y + 44}" width="${w - 32}" height="32" rx="4" fill="${status.bg}"/>
    <text x="${x + w / 2}" y="${y + 65}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${TEXT}">${status.text}</text>
    ${
      connected
        ? `
    <rect x="${x + 16}" y="${y + 88}" width="${w - 32}" height="32" rx="4" fill="${ACCENT}"/>
    <text x="${x + w / 2}" y="${y + 109}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="white">List Workouts</text>
    <rect x="${x + 16}" y="${y + 132}" width="${w - 32}" height="32" rx="4" fill="${ACCENT}"/>
    <text x="${x + w / 2}" y="${y + 153}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="white">Check Session</text>
    `
        : `
    <text x="${x + w / 2}" y="${y + 100}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="${MUTED}">Open Garmin Connect and navigate</text>
    <text x="${x + w / 2}" y="${y + 116}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="${MUTED}">around to activate the session.</text>
    <rect x="${x + 16}" y="${y + 132}" width="${w - 32}" height="32" rx="4" fill="${ACCENT}"/>
    <text x="${x + w / 2}" y="${y + 153}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="white">Check Session</text>
    `
    }`;
};

const arrow = (x1, y1, x2, y2) => `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ACCENT}" stroke-width="3" stroke-dasharray="8 4"/>
  <polygon points="${x2},${y2 - 8} ${x2 + 12},${y2} ${x2},${y2 + 8}" fill="${ACCENT}"/>`;

function render(svg, width, height, filename) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { defaultFontFamily: "Arial" },
  });
  const rendered = resvg.render();
  writeFileSync(join(outDir, filename), rendered.asPng());
  console.log(`  ${filename} (${width}x${height})`);
}

// --- Screenshot 1280x800 ---
const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <rect width="1280" height="800" fill="${BG}"/>

  ${hexagonSymbol(640, 120, 2.2)}

  <text x="640" y="210" text-anchor="middle" font-family="system-ui, sans-serif" font-size="42" font-weight="700" fill="${TEXT}">Kaiord Garmin Bridge</text>
  <text x="640" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="${MUTED}">Push workouts from your editor to Garmin Connect</text>

  <!-- Flow: Editor → Extension → Garmin -->
  <rect x="80" y="360" width="300" height="180" rx="12" fill="${SURFACE}" stroke="#334155" stroke-width="1"/>
  <text x="230" y="410" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="${TEXT}">Kaiord Editor</text>
  <text x="230" y="440" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Create structured workouts</text>
  <text x="230" y="460" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">with intervals, targets,</text>
  <text x="230" y="480" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">and sport zones</text>

  ${arrow(380, 450, 460, 450)}

  ${popupMockup(470, 340, 340, 200, true)}

  ${arrow(810, 450, 890, 450)}

  <rect x="900" y="360" width="300" height="180" rx="12" fill="${SURFACE}" stroke="#334155" stroke-width="1"/>
  <text x="1050" y="410" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="${TEXT}">Garmin Connect</text>
  <text x="1050" y="440" text-anchor="middle" font-family="system-uri, sans-serif" font-size="13" fill="${MUTED}">Workout synced to your</text>
  <text x="1050" y="460" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Garmin watch or device</text>
  <text x="1050" y="490" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#22c55e">Ready to train</text>

  <!-- Features -->
  <text x="260" y="640" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">No passwords needed</text>
  <text x="260" y="664" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">Uses your browser session</text>

  <text x="640" y="640" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">Zero data collection</text>
  <text x="640" y="664" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">No analytics or telemetry</text>

  <text x="1020" y="640" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">Fully open source</text>
  <text x="1020" y="664" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${MUTED}">github.com/pablo-albaladejo/kaiord</text>

  <text x="640" y="770" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#475569">kaiord.com</text>
</svg>`;

// --- Small promo tile 440x280 ---
const smallTileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280">
  <rect width="440" height="280" fill="${BG}"/>
  ${hexagonSymbol(220, 80, 1.8)}
  <text x="220" y="160" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="${TEXT}">Kaiord Garmin Bridge</text>
  <text x="220" y="192" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="${MUTED}">Push workouts from your editor</text>
  <text x="220" y="212" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="${MUTED}">to Garmin Connect</text>
  <text x="220" y="258" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#475569">kaiord.com</text>
</svg>`;

// --- Marquee promo tile 1400x560 ---
const marqueeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 560" width="1400" height="560">
  <rect width="1400" height="560" fill="${BG}"/>

  ${hexagonSymbol(350, 280, 5)}

  <text x="820" y="220" text-anchor="middle" font-family="system-ui, sans-serif" font-size="48" font-weight="700" fill="${TEXT}">Kaiord Garmin Bridge</text>
  <text x="820" y="270" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" fill="${MUTED}">Push structured workouts from your editor</text>
  <text x="820" y="300" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" fill="${MUTED}">directly to Garmin Connect</text>

  <text x="660" y="380" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">No passwords</text>
  <text x="660" y="400" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">Uses your browser session</text>

  <text x="860" y="380" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">Zero tracking</text>
  <text x="860" y="400" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">No analytics or telemetry</text>

  <text x="1040" y="380" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${ACCENT}">Open source</text>
  <text x="1040" y="400" font-family="system-ui, sans-serif" font-size="12" fill="${MUTED}">Fully transparent code</text>

  <text x="820" y="510" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#475569">kaiord.com</text>
</svg>`;

console.log("Generating CWS store assets...");
render(screenshotSvg, 1280, 800, "screenshot-1280x800.png");
render(smallTileSvg, 440, 280, "small-promo-440x280.png");
render(marqueeSvg, 1400, 560, "marquee-promo-1400x560.png");
console.log("Done!");
