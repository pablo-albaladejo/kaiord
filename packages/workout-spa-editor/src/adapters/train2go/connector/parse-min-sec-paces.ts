import { DOM_BANDS, extractInputValueByNameSuffix } from "./details-inputs";
import { sliceWithinForm } from "./details-slices";
import type {
  Train2GoMinSec,
  Train2GoMinSecPaces,
} from "./train2go-zones-payload";

const readMinSec = (
  slice: string,
  bound: string
): Train2GoMinSec | undefined => {
  const min = extractInputValueByNameSuffix(slice, `${bound}][0]`);
  const sec = extractInputValueByNameSuffix(slice, `${bound}][1]`);
  return typeof min === "number" && typeof sec === "number"
    ? { min, sec }
    : undefined;
};

// Run/swim bounds are `[min, sec]` pairs. z4Upper comes from the Z4 band
// when complete, else straight from DOM `z3_upper` for partial forms.
export const parseMinSecPaces = (
  block: string,
  sportIdPattern: RegExp
): Train2GoMinSecPaces | null => {
  const slice = sliceWithinForm(block, sportIdPattern);
  if (!slice) return null;
  const out: Train2GoMinSecPaces = {};
  for (const [i, key] of DOM_BANDS) {
    const lower = readMinSec(slice, `z${i}_lower`);
    const upper = readMinSec(slice, `z${i}_upper`);
    if (lower && upper) out[key] = { lower, upper };
  }
  if (out.z4) {
    out.z4Upper = out.z4.upper;
  } else {
    const direct = readMinSec(slice, "z3_upper");
    if (direct) out.z4Upper = direct;
  }
  return Object.keys(out).length > 0 ? out : null;
};
