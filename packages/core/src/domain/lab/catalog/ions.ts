import type { LabParameter } from "../lab-parameter";

/** Serum electrolytes and minerals. */
export const IONS: readonly LabParameter[] = [
  {
    key: "sodium",
    canonicalUnit: "mEq/L",
    canonicalRefLow: 136,
    canonicalRefHigh: 145,
    panel: "ions",
  },
  {
    key: "potassium",
    canonicalUnit: "mEq/L",
    canonicalRefLow: 3.5,
    canonicalRefHigh: 5.1,
    panel: "ions",
  },
  {
    key: "calcium",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 8.6,
    canonicalRefHigh: 10.2,
    panel: "ions",
  },
  {
    key: "magnesium",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 1.6,
    canonicalRefHigh: 2.6,
    panel: "ions",
  },
  {
    key: "phosphorus",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 2.5,
    canonicalRefHigh: 4.5,
    panel: "ions",
  },
];
