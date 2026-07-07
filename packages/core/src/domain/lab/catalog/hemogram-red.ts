import type { LabParameter } from "../lab-parameter";

/** Red-cell series and erythrocyte indices. Ranges are orientative fallbacks. */
export const HEMOGRAM_RED: readonly LabParameter[] = [
  {
    key: "rbc",
    nameES: "Hematíes",
    abbrev: "RBC",
    canonicalUnit: "×10⁶/µL",
    refBySex: {
      male: { low: 4.5, high: 5.9 },
      female: { low: 4.0, high: 5.2 },
    },
    panel: "hemogram",
  },
  {
    key: "hemoglobin",
    nameES: "Hemoglobina",
    abbrev: "Hb",
    canonicalUnit: "g/dL",
    refBySex: {
      male: { low: 13.5, high: 17.5 },
      female: { low: 12.0, high: 15.5 },
    },
    panel: "hemogram",
  },
  {
    key: "hematocrit",
    nameES: "Hematocrito",
    abbrev: "Hct",
    canonicalUnit: "%",
    refBySex: { male: { low: 41, high: 53 }, female: { low: 36, high: 46 } },
    panel: "hemogram",
  },
  {
    key: "mcv",
    nameES: "Volumen corpuscular medio",
    abbrev: "VCM",
    canonicalUnit: "fL",
    canonicalRefLow: 80,
    canonicalRefHigh: 100,
    panel: "hemogram",
  },
  {
    key: "mch",
    nameES: "Hemoglobina corpuscular media",
    abbrev: "HCM",
    canonicalUnit: "pg",
    canonicalRefLow: 27,
    canonicalRefHigh: 33,
    panel: "hemogram",
  },
  {
    key: "mchc",
    nameES: "Concentración de Hb corpuscular media",
    abbrev: "CHCM",
    canonicalUnit: "g/dL",
    canonicalRefLow: 32,
    canonicalRefHigh: 36,
    panel: "hemogram",
  },
  {
    key: "rdw",
    nameES: "Amplitud de distribución eritrocitaria",
    abbrev: "ADE",
    canonicalUnit: "%",
    canonicalRefLow: 11.5,
    canonicalRefHigh: 14.5,
    panel: "hemogram",
  },
];
