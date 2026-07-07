import type { LabParameter } from "../lab-parameter";

/**
 * Hormones and athlete markers. Testosterone/cortisol are circadian and
 * cortisol's range only holds at a fixed draw time; CK/hs-CRP rise after
 * intense exercise without pathology. Ranges are orientative fallbacks.
 */
export const HORMONES_SPORTS: readonly LabParameter[] = [
  {
    key: "testosterone",
    nameES: "Testosterona total",
    abbrev: "TESTO",
    canonicalUnit: "ng/dL",
    refBySex: {
      male: { low: 300, high: 1000 },
      female: { low: 15, high: 70 },
    },
    panel: "hormones",
  },
  {
    key: "cortisol",
    nameES: "Cortisol",
    abbrev: "CORT",
    canonicalUnit: "µg/dL",
    canonicalRefLow: 6,
    canonicalRefHigh: 23,
    panel: "hormones",
  },
  {
    key: "ck",
    nameES: "Creatina quinasa",
    abbrev: "CK",
    canonicalUnit: "U/L",
    canonicalRefLow: 30,
    canonicalRefHigh: 200,
    panel: "sports",
  },
  {
    key: "hs_crp",
    nameES: "PCR ultrasensible",
    abbrev: "hs-CRP",
    canonicalUnit: "mg/L",
    canonicalRefHigh: 3,
    panel: "sports",
  },
];
