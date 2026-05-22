/**
 * Per-metric round-trip tolerances for the six health KRD types.
 *
 * Centralised so test suites import them rather than hardcoding values
 * per fixture. See the `health-data` capability spec for rationale.
 */

export const SLEEP_STAGE_TOLERANCE_SECONDS = 60;
export const SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS = 60;
export const WEIGHT_TOLERANCE_KG = 0.1;
export const HRV_TOLERANCE_MS = 1;
export const DAILY_STEPS_TOLERANCE = 0;
export const DAILY_KCAL_TOLERANCE = 1;
export const BODY_FAT_TOLERANCE_PERCENT = 0.1;
export const STRESS_TOLERANCE = 0;
