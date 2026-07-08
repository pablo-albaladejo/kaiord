import type { LabParameter } from "../lab-parameter";

/**
 * Thyroid and vitamins. Vitamin D carries the `nmol/L → ng/mL` factor (×0.4);
 * cutoffs vary by society, so the fallback low is the orientative optimum.
 */
export const THYROID_VITAMINS: readonly LabParameter[] = [
  {
    key: "tsh",
    canonicalUnit: "mUI/L",
    canonicalRefLow: 0.4,
    canonicalRefHigh: 4.0,
    panel: "thyroid",
  },
  {
    key: "free_t4",
    canonicalUnit: "ng/dL",
    canonicalRefLow: 0.8,
    canonicalRefHigh: 1.8,
    panel: "thyroid",
  },
  {
    key: "vitamin_d",
    canonicalUnit: "ng/mL",
    knownUnits: [{ unit: "nmol/L", factorToCanonical: 0.4 }],
    canonicalRefLow: 30,
    panel: "vitamins",
  },
  {
    key: "vitamin_b12",
    canonicalUnit: "pg/mL",
    canonicalRefLow: 200,
    canonicalRefHigh: 900,
    panel: "vitamins",
  },
  {
    key: "folate",
    canonicalUnit: "ng/mL",
    canonicalRefLow: 3,
    canonicalRefHigh: 17,
    panel: "vitamins",
  },
];
