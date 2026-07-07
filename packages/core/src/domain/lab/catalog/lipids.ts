import type { LabParameter } from "../lab-parameter";

/** Lipid profile. non-HDL and LDL are reported when the informe carries them. */
export const LIPIDS: readonly LabParameter[] = [
  {
    key: "cholesterol_total",
    nameES: "Colesterol total",
    abbrev: "CT",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 200,
    panel: "lipids",
  },
  {
    key: "ldl",
    nameES: "LDL colesterol",
    abbrev: "LDL",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 100,
    panel: "lipids",
  },
  {
    key: "hdl",
    nameES: "HDL colesterol",
    abbrev: "HDL",
    canonicalUnit: "mg/dL",
    refBySex: { male: { low: 40 }, female: { low: 50 } },
    panel: "lipids",
  },
  {
    key: "triglycerides",
    nameES: "Triglicéridos",
    abbrev: "TG",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 150,
    panel: "lipids",
  },
  {
    key: "non_hdl",
    nameES: "Colesterol no-HDL",
    abbrev: "no-HDL",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 130,
    panel: "lipids",
  },
  {
    key: "apob",
    nameES: "Apolipoproteína B",
    abbrev: "ApoB",
    canonicalUnit: "mg/dL",
    canonicalRefHigh: 100,
    panel: "lipids",
  },
];
