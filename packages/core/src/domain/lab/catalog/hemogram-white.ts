import type { LabParameter } from "../lab-parameter";

/**
 * Leukocytes, platelets and the first differential fractions. The differential
 * is split into `*_pct` and `*_abs` keys — distinct, non-convertible magnitudes.
 */
export const HEMOGRAM_WHITE: readonly LabParameter[] = [
  {
    key: "wbc",
    nameES: "Leucocitos",
    abbrev: "WBC",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 4.0,
    canonicalRefHigh: 11.0,
    panel: "hemogram",
  },
  {
    key: "platelets",
    nameES: "Plaquetas",
    abbrev: "PLT",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 150,
    canonicalRefHigh: 400,
    panel: "hemogram",
  },
  {
    key: "mpv",
    nameES: "Volumen plaquetario medio",
    abbrev: "VPM",
    canonicalUnit: "fL",
    canonicalRefLow: 7.5,
    canonicalRefHigh: 11.5,
    panel: "hemogram",
  },
  {
    key: "neutrophils_pct",
    nameES: "Neutrófilos %",
    abbrev: "NEU%",
    canonicalUnit: "%",
    canonicalRefLow: 40,
    canonicalRefHigh: 75,
    panel: "hemogram",
  },
  {
    key: "neutrophils_abs",
    nameES: "Neutrófilos absolutos",
    abbrev: "NEU#",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 1.8,
    canonicalRefHigh: 7.7,
    panel: "hemogram",
  },
  {
    key: "lymphocytes_pct",
    nameES: "Linfocitos %",
    abbrev: "LYM%",
    canonicalUnit: "%",
    canonicalRefLow: 20,
    canonicalRefHigh: 45,
    panel: "hemogram",
  },
  {
    key: "lymphocytes_abs",
    nameES: "Linfocitos absolutos",
    abbrev: "LYM#",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 1.0,
    canonicalRefHigh: 4.8,
    panel: "hemogram",
  },
];
