type Range = { min: number; max: number };

/**
 * Shared refinement for range target variants: `min` must not exceed
 * `max`. Attached to the range member of each target-value discriminated
 * union so inverted ranges (e.g. `{ min: 200, max: 150 }`) fail schema
 * validation instead of silently corrupting round-trip conversions.
 */
export const minLteMax = (range: Range): boolean => range.min <= range.max;

export const MIN_LTE_MAX_MESSAGE = "min must be less than or equal to max";

/** Stable, language-free code for an inverted min/max range. */
export const MIN_LTE_MAX_CODE = "min_gt_max";
