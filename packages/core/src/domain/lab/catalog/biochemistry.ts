import type { LabParameter } from "../lab-parameter";

/**
 * Basic biochemistry. HbA1c is the only core parameter with an affine
 * alternate unit: `mmol/mol` (IFCC) → `%` (NGSP) via `× 0.0915 + 2.15`.
 * eGFR is a reported (not computed) value; kaiord records it when present.
 */
export const BIOCHEMISTRY: readonly LabParameter[] = [
  {
    key: "glucose",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 70,
    canonicalRefHigh: 99,
    panel: "biochemistry",
  },
  {
    key: "hba1c",
    canonicalUnit: "%",
    knownUnits: [
      { unit: "mmol/mol", factorToCanonical: 0.0915, offsetToCanonical: 2.15 },
    ],
    canonicalRefHigh: 5.7,
    panel: "biochemistry",
  },
  {
    key: "creatinine",
    canonicalUnit: "mg/dL",
    refBySex: {
      male: { low: 0.7, high: 1.3 },
      female: { low: 0.6, high: 1.1 },
    },
    panel: "biochemistry",
  },
  {
    key: "urea",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 15,
    canonicalRefHigh: 45,
    panel: "biochemistry",
  },
  {
    key: "uric_acid",
    canonicalUnit: "mg/dL",
    refBySex: {
      male: { low: 3.5, high: 7.2 },
      female: { low: 2.6, high: 6.0 },
    },
    panel: "biochemistry",
  },
  {
    key: "egfr",
    canonicalUnit: "mL/min/1.73m²",
    canonicalRefLow: 90,
    panel: "biochemistry",
  },
];
