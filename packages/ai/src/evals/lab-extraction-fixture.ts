/**
 * A fully synthetic lab report (no real patient data). Passed to the extractor
 * as a `text/plain` document part so the manual eval exercises the multimodal
 * file path against a real provider without shipping clinical data.
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
  "GPT (ALT)                 30          U/L        7 - 56",
  "Hemoglobina               14,8        g/dL       13.0 - 17.0",
  "TSH                       2,1         mUI/L      0.4 - 4.0",
].join("\n");

/** Canonical keys the extractor is expected to recover from the fixture. */
export const EXPECTED_KEYS = [
  "glucose",
  "cholesterol_total",
  "hdl",
  "triglycerides",
  "alt",
  "hemoglobin",
  "tsh",
];
