/**
 * A fully synthetic lab report (no real patient data). Passed to the extractor
 * as a `text/plain` document part so the manual eval exercises the multimodal
 * file path against a real provider without shipping clinical data.
 *
 * Every row is here to be discriminative. `GOT` and `GPT` are the Spanish
 * names for AST and ALT and sit adjacent with no parenthetical translation,
 * so mapping them is knowledge rather than token matching. Two values use a
 * decimal comma, the reference column carries all three printed shapes
 * (numeric range, `<`, `>`), and the last row is deliberately outside the
 * catalog: the extractor is told to omit `parameterKey` when unsure, and a
 * guessed key there is a failure, not a near miss.
 */
export const SYNTHETIC_LAB_REPORT = [
  "LABORATORIO EJEMPLO — Informe de análisis",
  "Fecha de extracción: 01/05/2026    Ayuno: Sí",
  "",
  "Parámetro                 Resultado   Unidad     Valores de referencia",
  "Glucosa                   92          mg/dL      70 - 100",
  "Colesterol total          185         mg/dL      < 200",
  "HDL                       58          mg/dL      > 40",
  "Triglicéridos             110         mg/dL      < 150",
  "GOT                       24          U/L        5 - 40",
  "GPT                       30          U/L        7 - 56",
  "Hemoglobina               14,8        g/dL       13.0 - 17.0",
  "TSH                       2,1         mUI/L      0.4 - 4.0",
  "Índice aterogénico        3,19                   < 5,0",
].join("\n");

export type LabExpectation = {
  /** The printed label, used to locate the extracted row and to report. */
  label: string;
  /**
   * Canonical catalog key, or `null` when the parameter is outside the
   * catalog and the extractor must omit the key rather than guess one.
   */
  key: string | null;
  value: number;
  unit?: string;
  refLow?: number;
  refHigh?: number;
  refText?: string;
};

/** One expectation per printed row, in print order. */
export const EXPECTED_ROWS: readonly LabExpectation[] = [
  {
    label: "Glucosa",
    key: "glucose",
    value: 92,
    unit: "mg/dL",
    refLow: 70,
    refHigh: 100,
  },
  {
    label: "Colesterol total",
    key: "cholesterol_total",
    value: 185,
    unit: "mg/dL",
    refText: "< 200",
  },
  { label: "HDL", key: "hdl", value: 58, unit: "mg/dL", refText: "> 40" },
  {
    label: "Triglicéridos",
    key: "triglycerides",
    value: 110,
    unit: "mg/dL",
    refText: "< 150",
  },
  { label: "GOT", key: "ast", value: 24, unit: "U/L", refLow: 5, refHigh: 40 },
  { label: "GPT", key: "alt", value: 30, unit: "U/L", refLow: 7, refHigh: 56 },
  {
    label: "Hemoglobina",
    key: "hemoglobin",
    value: 14.8,
    unit: "g/dL",
    refLow: 13,
    refHigh: 17,
  },
  {
    label: "TSH",
    key: "tsh",
    value: 2.1,
    unit: "mUI/L",
    refLow: 0.4,
    refHigh: 4,
  },
  { label: "Índice aterogénico", key: null, value: 3.19, refText: "< 5,0" },
];

/** Report-level metadata the header states explicitly. */
export const EXPECTED_METADATA = { date: "2026-05-01", fasting: true };

/** Kept for callers that only need the canonical keys the report contains. */
export const EXPECTED_KEYS: readonly string[] = EXPECTED_ROWS.map(
  (row) => row.key
).filter((key): key is string => key !== null);
