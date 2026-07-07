import type { LabParameter } from "../lab-parameter";

/** Liver panel. AST/ALT/GGT ranges vary by method; orientative fallbacks. */
export const HEPATIC: readonly LabParameter[] = [
  {
    key: "ast",
    nameES: "AST (GOT)",
    abbrev: "AST",
    canonicalUnit: "U/L",
    canonicalRefLow: 5,
    canonicalRefHigh: 40,
    panel: "hepatic",
  },
  {
    key: "alt",
    nameES: "ALT (GPT)",
    abbrev: "ALT",
    canonicalUnit: "U/L",
    refBySex: { male: { low: 7, high: 56 }, female: { low: 7, high: 45 } },
    panel: "hepatic",
  },
  {
    key: "ggt",
    nameES: "GGT",
    abbrev: "GGT",
    canonicalUnit: "U/L",
    refBySex: { male: { low: 10, high: 71 }, female: { low: 6, high: 42 } },
    panel: "hepatic",
  },
  {
    key: "alp",
    nameES: "Fosfatasa alcalina",
    abbrev: "FA",
    canonicalUnit: "U/L",
    canonicalRefLow: 40,
    canonicalRefHigh: 129,
    panel: "hepatic",
  },
  {
    key: "bilirubin_total",
    nameES: "Bilirrubina total",
    abbrev: "BT",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 0.2,
    canonicalRefHigh: 1.2,
    panel: "hepatic",
  },
  {
    key: "bilirubin_direct",
    nameES: "Bilirrubina directa",
    abbrev: "BD",
    canonicalUnit: "mg/dL",
    canonicalRefLow: 0.0,
    canonicalRefHigh: 0.3,
    panel: "hepatic",
  },
];
