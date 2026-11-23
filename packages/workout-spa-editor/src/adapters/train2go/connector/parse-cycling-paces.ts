import { DOM_BANDS, extractInputValueByNameSuffix } from "./details-inputs";
import { sliceWithinForm } from "./details-slices";
import type { Train2GoCyclingPaces } from "./train2go-zones-payload";

const readBands = (slice: string): Train2GoCyclingPaces => {
  const out: Train2GoCyclingPaces = {};
  for (const [i, key] of DOM_BANDS) {
    const lower = extractInputValueByNameSuffix(slice, `z${i}_lower][0]`);
    const upper = extractInputValueByNameSuffix(slice, `z${i}_upper][0]`);
    if (typeof lower === "number" && typeof upper === "number") {
      out[key] = { lower, upper };
    }
  }
  return out;
};

// Watts, one integer per bound. Visual Z4 upper (DOM z3_upper) is FTP and
// visual Z5 lower (DOM z4_lower) its fallback; both come from the band
// when complete, else straight from the DOM so partial forms still work.
export const parseCyclingPaces = (
  block: string
): Train2GoCyclingPaces | null => {
  const slice = sliceWithinForm(block, /sport_id"[^>]+value="3"/);
  if (!slice) return null;
  const out = readBands(slice);
  if (out.z4) {
    out.z4Upper = out.z4.upper;
  } else {
    const direct = extractInputValueByNameSuffix(slice, `z3_upper][0]`);
    if (typeof direct === "number") out.z4Upper = direct;
  }
  if (out.z5) {
    out.z5Lower = out.z5.lower;
  } else {
    const direct = extractInputValueByNameSuffix(slice, `z4_lower][0]`);
    if (typeof direct === "number") out.z5Lower = direct;
  }
  return Object.keys(out).length > 0 ? out : null;
};
