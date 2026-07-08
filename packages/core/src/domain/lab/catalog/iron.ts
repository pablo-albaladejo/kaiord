import type { LabParameter } from "../lab-parameter";

/** Iron metabolism. Ferritin is assay-dependent; ranges are orientative. */
export const IRON: readonly LabParameter[] = [
  {
    key: "iron",
    canonicalUnit: "µg/dL",
    refBySex: {
      male: { low: 65, high: 175 },
      female: { low: 50, high: 170 },
    },
    panel: "iron",
  },
  {
    key: "ferritin",
    canonicalUnit: "ng/mL",
    refBySex: {
      male: { low: 20, high: 250 },
      female: { low: 10, high: 120 },
    },
    panel: "iron",
  },
  {
    key: "transferrin",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 200,
    canonicalRefHigh: 360,
    panel: "iron",
  },
  {
    key: "tsat",
    canonicalUnit: "%",
    canonicalRefLow: 20,
    canonicalRefHigh: 50,
    panel: "iron",
  },
];
