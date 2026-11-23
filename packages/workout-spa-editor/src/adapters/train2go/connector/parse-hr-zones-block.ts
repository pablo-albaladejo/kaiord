import { DOM_BANDS, extractHrBandValue } from "./details-inputs";
import { sliceBetween } from "./details-slices";
import { replaceUntilStable } from "./replace-until-stable";
import type {
  Train2GoHrBands,
  Train2GoHrZones,
} from "./train2go-zones-payload";

const HR_SPORTS = ["cycling", "running", "swimming"] as const;

// Slices the `heart-rate-zone-<label>` wrapper up to the next
// `heart-rate-zone-X`, `</section>` or end, so blocks never bleed.
const extractHrFullBands = (
  block: string,
  label: string
): Train2GoHrBands | null => {
  const wrapperRe = new RegExp(
    `heart-rate-zone-${label}[\\s\\S]*?(?=heart-rate-zone-(?!${label})|<\\/section>|$)`,
    "i"
  );
  const m = block.match(wrapperRe);
  if (!m) return null;
  const sportBlock = m[0];
  const out: Train2GoHrBands = {};
  for (const [i, key] of DOM_BANDS) {
    const lower = extractHrBandValue(sportBlock, `z${i}_lower`);
    const upper = extractHrBandValue(sportBlock, `z${i}_upper`);
    if (typeof lower === "number" && typeof upper === "number") {
      out[key] = { lower, upper };
    }
  }
  if (out.z4) {
    out.z4Upper = out.z4.upper;
  } else {
    const direct = extractHrBandValue(sportBlock, "z3_upper");
    if (typeof direct === "number") out.z4Upper = direct;
  }
  return Object.keys(out).length > 0 ? out : null;
};

// Sport blocks live INSIDE `<div id="hrzones-{id}">`; Generic is a
// SIBLING outside it, so it is read from the full HTML. HTML comments
// go first so prose mentioning zone class names cannot anchor a wrapper.
export const parseHrZonesBlock = (html: string): Train2GoHrZones | null => {
  const stripped = replaceUntilStable(html, /<!--[\s\S]*?-->/g, "");
  const block = sliceBetween(
    stripped,
    /id="hrzones-\d+"/,
    /<\/main>|<\/section>/
  );
  const out: Train2GoHrZones = {};
  const generic = extractHrFullBands(stripped, "generic");
  if (generic) out.generic = generic;
  if (block) {
    for (const sport of HR_SPORTS) {
      const bands = extractHrFullBands(block, sport);
      if (bands) out[sport] = bands;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
};
