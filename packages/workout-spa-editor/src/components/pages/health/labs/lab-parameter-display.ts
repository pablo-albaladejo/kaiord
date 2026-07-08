/**
 * Presentation-layer English display text for the language-agnostic core lab
 * catalog. Domain `core` carries only identity + objective data; the visible
 * name and clinical abbreviation live here, keyed by `LabParameter.key`.
 * Spanish will arrive with a future global i18n layer (out of scope).
 */
export type LabParameterDisplay = { name: string; abbrev: string };

const DISPLAY_BY_KEY: Record<string, LabParameterDisplay> = {
  rbc: { name: "Red blood cells", abbrev: "RBC" },
  hemoglobin: { name: "Hemoglobin", abbrev: "Hb" },
  hematocrit: { name: "Hematocrit", abbrev: "Hct" },
  mcv: { name: "Mean corpuscular volume", abbrev: "MCV" },
  mch: { name: "Mean corpuscular hemoglobin", abbrev: "MCH" },
  mchc: { name: "Mean corpuscular hemoglobin concentration", abbrev: "MCHC" },
  rdw: { name: "Red cell distribution width", abbrev: "RDW" },
  wbc: { name: "White blood cells", abbrev: "WBC" },
  platelets: { name: "Platelets", abbrev: "PLT" },
  mpv: { name: "Mean platelet volume", abbrev: "MPV" },
  neutrophils_pct: { name: "Neutrophils %", abbrev: "NEU%" },
  neutrophils_abs: { name: "Neutrophils absolute", abbrev: "NEU#" },
  lymphocytes_pct: { name: "Lymphocytes %", abbrev: "LYM%" },
  lymphocytes_abs: { name: "Lymphocytes absolute", abbrev: "LYM#" },
  monocytes_pct: { name: "Monocytes %", abbrev: "MON%" },
  monocytes_abs: { name: "Monocytes absolute", abbrev: "MON#" },
  eosinophils_pct: { name: "Eosinophils %", abbrev: "EOS%" },
  eosinophils_abs: { name: "Eosinophils absolute", abbrev: "EOS#" },
  basophils_pct: { name: "Basophils %", abbrev: "BAS%" },
  basophils_abs: { name: "Basophils absolute", abbrev: "BAS#" },
  glucose: { name: "Glucose (fasting)", abbrev: "GLU" },
  hba1c: { name: "Glycated hemoglobin", abbrev: "HbA1c" },
  creatinine: { name: "Creatinine", abbrev: "CREA" },
  urea: { name: "Urea", abbrev: "UREA" },
  uric_acid: { name: "Uric acid", abbrev: "URIC" },
  egfr: { name: "Estimated glomerular filtration rate", abbrev: "eGFR" },
  cholesterol_total: { name: "Total cholesterol", abbrev: "TC" },
  ldl: { name: "LDL cholesterol", abbrev: "LDL" },
  hdl: { name: "HDL cholesterol", abbrev: "HDL" },
  triglycerides: { name: "Triglycerides", abbrev: "TG" },
  non_hdl: { name: "Non-HDL cholesterol", abbrev: "non-HDL" },
  apob: { name: "Apolipoprotein B", abbrev: "ApoB" },
  ast: { name: "Aspartate aminotransferase", abbrev: "AST" },
  alt: { name: "Alanine aminotransferase", abbrev: "ALT" },
  ggt: { name: "Gamma-glutamyl transferase", abbrev: "GGT" },
  alp: { name: "Alkaline phosphatase", abbrev: "ALP" },
  bilirubin_total: { name: "Total bilirubin", abbrev: "TBIL" },
  bilirubin_direct: { name: "Direct bilirubin", abbrev: "DBIL" },
  sodium: { name: "Sodium", abbrev: "Na" },
  potassium: { name: "Potassium", abbrev: "K" },
  calcium: { name: "Total calcium", abbrev: "Ca" },
  magnesium: { name: "Magnesium", abbrev: "Mg" },
  phosphorus: { name: "Phosphorus", abbrev: "P" },
  iron: { name: "Serum iron", abbrev: "Fe" },
  ferritin: { name: "Ferritin", abbrev: "FERR" },
  transferrin: { name: "Transferrin", abbrev: "TRF" },
  tsat: { name: "Transferrin saturation", abbrev: "TSAT" },
  tsh: { name: "Thyroid-stimulating hormone", abbrev: "TSH" },
  free_t4: { name: "Free thyroxine", abbrev: "FT4" },
  vitamin_d: { name: "Vitamin D (25-OH)", abbrev: "25-OH-D" },
  vitamin_b12: { name: "Vitamin B12", abbrev: "B12" },
  folate: { name: "Folate", abbrev: "FOL" },
  testosterone: { name: "Total testosterone", abbrev: "TESTO" },
  cortisol: { name: "Cortisol", abbrev: "CORT" },
  ck: { name: "Creatine kinase", abbrev: "CK" },
  hs_crp: { name: "High-sensitivity CRP", abbrev: "hs-CRP" },
};

/** Keys the display map covers — used to guard catalog/display parity. */
export const LAB_PARAMETER_DISPLAY_KEYS: readonly string[] =
  Object.keys(DISPLAY_BY_KEY);

/** Stable `"Name (ABBREV)"` label from a display descriptor. */
export const formatLabParameterLabel = (d: LabParameterDisplay): string =>
  `${d.name} (${d.abbrev})`;

/** English display (name + abbrev) for a core parameter key, if catalogued. */
export function getLabParameterDisplay(
  key: string
): LabParameterDisplay | undefined {
  return DISPLAY_BY_KEY[key];
}
