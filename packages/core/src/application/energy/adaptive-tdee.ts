/**
 * Adaptive TDEE (maintenance) back-calculation. Pure; no adapter/external deps.
 *
 * Once enough paired intake + weight history exists, real maintenance energy is
 * recovered from the observed smoothed weight change versus the average logged
 * intake over a rolling window, rather than the modeled BMR + activity estimate.
 *
 * Energy-balance identity (fat-mass basis):
 *   weightChangeKg = (avgDailyIntakeKcal − maintenanceKcal) · windowDays
 *                    / KCAL_PER_KG_FAT
 * Solving for maintenance:
 *   maintenanceKcal = avgDailyIntakeKcal
 *                     − (weightChangeKg · KCAL_PER_KG_FAT / windowDays)
 *
 * A weight DROP (negative `weightChangeKg`) at a given intake implies
 * maintenance ABOVE intake; a weight GAIN implies maintenance below intake.
 *
 * The result is always flagged `isEstimate: true`. `sufficientData` is false
 * (and the modeled maintenance should stay in use) until at least
 * `MIN_ADAPTIVE_DAYS` of paired data back the window.
 */

/** Energy density of body fat (kcal per kg) used for the balance identity. */
export const KCAL_PER_KG_FAT = 7700;

/** Minimum paired-history days before adaptive maintenance activates. */
export const MIN_ADAPTIVE_DAYS = 14;

export type ComputeAdaptiveTdeeInput = {
  /** Average logged daily intake (kcal) over the window. */
  avgDailyIntakeKcal: number;
  /** Smoothed weight change over the window (kg; negative = loss). */
  weightChangeKg: number;
  /** Calendar span of the window (days); the rate denominator. */
  windowDays: number;
  /** Days with usable paired data; gates `sufficientData`. */
  daysWithData: number;
};

export type AdaptiveTdeeResult = {
  /** Back-calculated maintenance energy (kcal/day). Always an estimate. */
  maintenanceKcal: number;
  /** Always true: the value is inferred from observed history, not modeled. */
  isEstimate: true;
  /** True once `daysWithData >= MIN_ADAPTIVE_DAYS` and the window is valid. */
  sufficientData: boolean;
};

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const assertInputs = (input: ComputeAdaptiveTdeeInput): void => {
  if (
    !Number.isFinite(input.avgDailyIntakeKcal) ||
    !Number.isFinite(input.weightChangeKg) ||
    !isPositiveFinite(input.windowDays)
  ) {
    throw new RangeError(
      "computeAdaptiveTdee requires finite intake/weight and a positive windowDays."
    );
  }
};

/**
 * Back-calculate adaptive maintenance from average intake versus the smoothed
 * weight change over a window.
 *
 * @throws RangeError when intake/weight are non-finite or `windowDays` <= 0.
 */
export const computeAdaptiveTdee = (
  input: ComputeAdaptiveTdeeInput
): AdaptiveTdeeResult => {
  assertInputs(input);
  const dailyImbalanceKcal =
    (input.weightChangeKg * KCAL_PER_KG_FAT) / input.windowDays;
  return {
    maintenanceKcal: input.avgDailyIntakeKcal - dailyImbalanceKcal,
    isEstimate: true,
    sufficientData: input.daysWithData >= MIN_ADAPTIVE_DAYS,
  };
};
