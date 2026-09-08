// Turn the bbox measurements into grade files.
//
// Grading by eye on a contact sheet manufactures verdicts: the storybook shot is
// a tight crop of the element while the ds shot is the full 900x700 page, so the
// preview always looks smaller and every block-level component looks wider. What
// is comparable is the CONTENT bounding box of the raw PNGs, and the rule the
// prior campaign settled on is that HEIGHT is the signal and WIDTH is framing.
//
// The verdicts here are mechanical consequences of that rule, each carrying the
// numbers that produced it so a human can check the call rather than trust it:
//
//   match     heights agree within 4px — framing only.
//   close     the ds panel is clipped at the viewport (its bbox bottom is the
//             last row of the 700px page) while storybook, which crops to the
//             element, shows the whole thing. The component is not restyled; the
//             card is too short for it. Real, worth recording, not a defect.
//   mismatch  heights differ and the ds panel is NOT clipped — something is
//             actually rendering differently.
//
// Usage: node .design-sync/write-grades.mjs <measures.json> [--dry]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(REPO, ".design-sync/.cache/compare");
const DRY = process.argv.includes("--dry");
const measures = JSON.parse(readFileSync(process.argv[2], "utf8"));

const byComponent = new Map();
for (const m of measures) {
  if (!byComponent.has(m.component)) byComponent.set(m.component, []);
  byComponent.get(m.component).push(m);
}

const tally = { match: 0, close: 0, mismatch: 0, ungraded: 0 };
let written = 0;

for (const [name, rows] of byComponent) {
  const stories = {};
  for (const r of rows) {
    // No raw pair, or a panel that is one flat colour: this script has no
    // evidence to grade on. Leave it out — an ungraded story is honest; a
    // guessed verdict is not.
    if (r.note || r.absent || !r.sb || !r.ds) {
      tally.ungraded++;
      continue;
    }
    const dh = r.ds.h - r.sb.h;
    if (Math.abs(dh) <= 4) {
      stories[r.story] = {
        verdict: "match",
        note: `content height ${r.ds.h}px both sides (±${Math.abs(dh)}); width differs by framing only (sb crops to the element, ds is the full 900x700 page)`,
      };
      tally.match++;
    } else if (r.clipped) {
      stories[r.story] = {
        verdict: "close",
        note: `ds clipped at the viewport: bbox bottom is the last row of the ${r.ds.page}px page (${r.ds.h}px shown of storybook's ${r.sb.h}px). The card is shorter than the component, not restyled`,
      };
      tally.close++;
    } else {
      stories[r.story] = {
        verdict: "mismatch",
        note: `content height differs and ds is not clipped: sb ${r.sb.h}px vs ds ${r.ds.h}px (${dh > 0 ? "+" : ""}${dh})`,
      };
      tally.mismatch++;
    }
  }
  if (!Object.keys(stories).length) continue;
  const out = join(CACHE, `${name}.grade.json`);
  if (!existsSync(join(CACHE, `${name}.json`))) {
    console.error(`  (skipped ${name}: no capture json)`);
    continue;
  }
  if (!DRY) writeFileSync(out, JSON.stringify({ stories }, null, 2) + "\n");
  written++;
}

console.log(`${DRY ? "would write" : "wrote"} ${written} grade file(s)`);
console.log(`  match ${tally.match} · close ${tally.close} · mismatch ${tally.mismatch} · ungraded ${tally.ungraded}`);
