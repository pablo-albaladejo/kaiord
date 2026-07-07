import type { LabParameter } from "../lab-parameter";

/** Serum electrolytes and minerals. */
export const IONS: readonly LabParameter[] = [
  {
    key: "sodium",
    nameES: "Sodio",
    abbrev: "Na",
    canonicalUnit: "mEq/L",
    canonicalRefLow: 136,
    canonicalRefHigh: 145,
    panel: "ions",
  },
  {
    key: "potassium",
    nameES: "Potasio",
    abbrev: "K",
    canonicalUnit: "mEq/L",
    canonicalRefLow: 3.5,
    canonicalRefHigh: 5.1,
    panel: "ions",
  },
  {
    key: "calcium",
    nameES: "Calcio total",
    abbrev: "Ca",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 8.6,
    canonicalRefHigh: 10.2,
    panel: "ions",
  },
  {
    key: "magnesium",
    nameES: "Magnesio",
    abbrev: "Mg",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 1.6,
    canonicalRefHigh: 2.6,
    panel: "ions",
  },
  {
    key: "phosphorus",
    nameES: "Fósforo",
    abbrev: "P",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 2.5,
    canonicalRefHigh: 4.5,
    panel: "ions",
  },
];
