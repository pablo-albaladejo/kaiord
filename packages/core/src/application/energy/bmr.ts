/**
 * Basal-metabolic-rate estimation. Pure functions, no adapter/external deps.
 *
 * Mifflin-St Jeor is the default; Katch-McArdle is used when a body-fat
 * fraction is known, since lean-mass-based BMR is more accurate. The chosen
 * formula is returned so callers (UI/chatbot) can explain the number.
 */

export type BmrFormula = "mifflin-st-jeor" | "katch-mcardle";

export type Sex = "male" | "female";

export type BmrInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  /** Body-fat as a fraction in [0, 1); enables Katch-McArdle. */
  bodyFatFraction?: number;
};

export type BmrResult = {
  kcal: number;
  formula: BmrFormula;
};

const MIFFLIN_MALE_OFFSET = 5;
const MIFFLIN_FEMALE_OFFSET = -161;
const KATCH_BASE = 370;
const KATCH_LEAN_COEFFICIENT = 21.6;

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const assertCoreInputs = (input: BmrInput): void => {
  if (
    !isPositiveFinite(input.weightKg) ||
    !isPositiveFinite(input.heightCm) ||
    !isPositiveFinite(input.age)
  ) {
    throw new RangeError(
      "BMR requires positive finite weightKg, heightCm, and age."
    );
  }
};

const hasUsableBodyFat = (fraction: number | undefined): fraction is number =>
  fraction !== undefined &&
  Number.isFinite(fraction) &&
  fraction >= 0 &&
  fraction < 1;

const mifflinStJeor = (input: BmrInput): number => {
  const sexOffset =
    input.sex === "male" ? MIFFLIN_MALE_OFFSET : MIFFLIN_FEMALE_OFFSET;
  return (
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexOffset
  );
};

const katchMcArdle = (weightKg: number, bodyFatFraction: number): number => {
  const leanMassKg = weightKg * (1 - bodyFatFraction);
  return KATCH_BASE + KATCH_LEAN_COEFFICIENT * leanMassKg;
};

/**
 * Estimate BMR (kcal/day). Uses Katch-McArdle when `bodyFatFraction` is a
 * valid [0, 1) fraction, otherwise Mifflin-St Jeor.
 *
 * @throws RangeError when weight, height, or age is not positive and finite.
 */
export const computeBmr = (input: BmrInput): BmrResult => {
  assertCoreInputs(input);
  if (hasUsableBodyFat(input.bodyFatFraction)) {
    return {
      kcal: katchMcArdle(input.weightKg, input.bodyFatFraction),
      formula: "katch-mcardle",
    };
  }
  return { kcal: mifflinStJeor(input), formula: "mifflin-st-jeor" };
};
