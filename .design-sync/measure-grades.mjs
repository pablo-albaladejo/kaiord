// Measure every compare pair so grading rests on numbers, not on eyeballing a
// contact sheet.
//
// The two panels are NOT at the same scale: the storybook shot is a tight crop
// of the element while the ds shot is the full 900x700 page, and the sheet
// shrinks both to fit its columns. So the preview always looks smaller and every
// block-level component looks wider — judging the sheet by eye manufactures
// `mismatch` verdicts out of framing. What is comparable is the CONTENT bounding
// box of each raw PNG.
//
// Reported per story, for a human to read:
//   sb / ds  content bbox (w x h) at an alpha/ink threshold, and the height
//   delta. Across a healthy batch the HEIGHT matches and only the WIDTH differs
//   — that is the signature of "framing only".
//
// A bbox of `null` means the panel is one flat colour: the component is ABSENT,
// not small. A bbox whose bottom row is the last row of the viewport means
// CLIPPED, not restyled.
//
// Usage: node .design-sync/measure-grades.mjs [--json out.json]

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(REPO, "packages/workout-spa-editor/package.json"));
const { chromium } = require("@playwright/test");

const RAW = join(REPO, "ds-bundle/_screenshots/compare/raw");
const CACHE = join(REPO, ".design-sync/.cache/compare");
const jsonFlag = process.argv.indexOf("--json");
const OUT = jsonFlag > -1 ? process.argv[jsonFlag + 1] : null;

// Measuring in a browser avoids adding an image library to the repo just for
// this, and gives the same pixel data PIL would.
const browser = await chromium.launch();
const page = await browser.newPage();

await page.addScriptTag({
  content: `
    window.__bbox = (src, threshold) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        // Background is whatever the corner pixel is; ink is anything far from it.
        const br = d[0], bg = d[1], bb = d[2];
        let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4;
            if (d[i + 3] < 8) continue;
            const dist = Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb);
            if (dist <= threshold) continue;
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
        resolve(x1 < 0 ? null : { w: x1 - x0 + 1, h: y1 - y0 + 1, bottom: y1, page: c.height });
      };
      img.onerror = () => resolve('load-error');
      img.src = src;
    });
  `,
});

const measure = async (file, threshold) => {
  const b64 = readFileSync(join(RAW, file)).toString("base64");
  return page.evaluate(
    ([src, t]) => window.__bbox(src, t),
    [`data:image/png;base64,${b64}`, threshold]
  );
};

const files = new Set(readdirSync(RAW));
const results = [];
for (const f of readdirSync(CACHE).sort()) {
  if (!f.endsWith(".json")) continue;
  const meta = JSON.parse(readFileSync(join(CACHE, f), "utf8"));
  for (const s of meta.stories ?? []) {
    const sb = s.sbShot?.split("/").pop();
    const ds = s.dsShot?.split("/").pop();
    if (!sb || !ds || !files.has(sb) || !files.has(ds)) {
      results.push({ component: meta.name, story: s.story, verdict: s.verdict, note: "no raw pair" });
      continue;
    }
    // Threshold 40, not 0: a soft box-shadow halo adds rows the storybook
    // element crop excludes by construction, which reads as a padding delta.
    const [a, b] = [await measure(sb, 40), await measure(ds, 40)];
    results.push({
      component: meta.name,
      story: s.story,
      verdict: s.verdict,
      sb: a,
      ds: b,
      absent: a === null || b === null,
      clipped: b && b.bottom === b.page - 1,
      dh: a && b ? b.h - a.h : null,
    });
  }
}

await browser.close();

const bad = results.filter((r) => r.absent || r.note);
const clipped = results.filter((r) => r.clipped);
const tall = results.filter((r) => r.dh !== null && Math.abs(r.dh) > 4);
console.log(`measured ${results.length} story pairs across ${new Set(results.map((r) => r.component)).size} components`);
console.log(`  absent/unpairable: ${bad.length}`);
console.log(`  clipped at viewport bottom: ${clipped.length}`);
console.log(`  height delta > 4px: ${tall.length}`);
for (const r of [...bad, ...clipped, ...tall].slice(0, 40)) {
  console.log(`  ${r.component} / ${r.story}: ${r.note ?? `sb=${JSON.stringify(r.sb)} ds=${JSON.stringify(r.ds)} dh=${r.dh}`}`);
}
if (OUT) writeFileSync(OUT, JSON.stringify(results, null, 2));
