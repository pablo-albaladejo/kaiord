import type { LabParameter } from "../lab-parameter";

/** Iron metabolism. Ferritin is assay-dependent; ranges are orientative. */
export const IRON: readonly LabParameter[] = [
  {
    key: "iron",
    nameES: "Hierro sérico",
    abbrev: "Fe",
    canonicalUnit: "µg/dL",
    refBySex: {
      male: { low: 65, high: 175 },
      female: { low: 50, high: 170 },
    },
    panel: "iron",
  },
  {
    key: "ferritin",
    nameES: "Ferritina",
    abbrev: "FERR",
    canonicalUnit: "ng/mL",
    refBySex: {
      male: { low: 20, high: 250 },
      female: { low: 10, high: 120 },
    },
    panel: "iron",
  },
  {
    key: "transferrin",
    nameES: "Transferrina",
    abbrev: "TRF",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 200,
    canonicalRefHigh: 360,
    panel: "iron",
  },
  {
    key: "tsat",
    nameES: "Índice de saturación de transferrina",
    abbrev: "IST",
    canonicalUnit: "%",
    canonicalRefLow: 20,
    canonicalRefHigh: 50,
    panel: "iron",
  },
];
