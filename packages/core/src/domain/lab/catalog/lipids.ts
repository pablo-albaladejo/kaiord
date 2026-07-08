import type { LabParameter } from "../lab-parameter";

/** Lipid profile. non-HDL and LDL are reported when the informe carries them. */
export const LIPIDS: readonly LabParameter[] = [
  {
    key: "cholesterol_total",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 200,
    panel: "lipids",
  },
  {
    key: "ldl",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 100,
    panel: "lipids",
  },
  {
    key: "hdl",
    canonicalUnit: "mg/dL",
    refBySex: { male: { low: 40 }, female: { low: 50 } },
    panel: "lipids",
  },
  {
    key: "triglycerides",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 150,
    panel: "lipids",
  },
  {
    key: "non_hdl",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 130,
    panel: "lipids",
  },
  {
    key: "apob",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 100,
    panel: "lipids",
  },
];
