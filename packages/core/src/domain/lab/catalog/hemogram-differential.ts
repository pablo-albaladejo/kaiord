import type { LabParameter } from "../lab-parameter";

/** Remaining differential fractions, `*_pct` and `*_abs` as separate keys. */
export const HEMOGRAM_DIFFERENTIAL: readonly LabParameter[] = [
  {
    key: "monocytes_pct",
    nameES: "Monocitos %",
    abbrev: "MON%",
    canonicalUnit: "%",
    canonicalRefLow: 2,
    canonicalRefHigh: 10,
    panel: "hemogram",
  },
  {
    key: "monocytes_abs",
    nameES: "Monocitos absolutos",
    abbrev: "MON#",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 0.2,
    canonicalRefHigh: 1.0,
    panel: "hemogram",
  },
  {
    key: "eosinophils_pct",
    nameES: "Eosinófilos %",
    abbrev: "EOS%",
    canonicalUnit: "%",
    canonicalRefLow: 1,
    canonicalRefHigh: 6,
    panel: "hemogram",
  },
  {
    key: "eosinophils_abs",
    nameES: "Eosinófilos absolutos",
    abbrev: "EOS#",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 0.0,
    canonicalRefHigh: 0.5,
    panel: "hemogram",
  },
  {
    key: "basophils_pct",
    nameES: "Basófilos %",
    abbrev: "BAS%",
    canonicalUnit: "%",
    canonicalRefLow: 0,
    canonicalRefHigh: 2,
    panel: "hemogram",
  },
  {
    key: "basophils_abs",
    nameES: "Basófilos absolutos",
    abbrev: "BAS#",
    canonicalUnit: "×10³/µL",
    canonicalRefLow: 0.0,
    canonicalRefHigh: 0.2,
    panel: "hemogram",
  },
];
