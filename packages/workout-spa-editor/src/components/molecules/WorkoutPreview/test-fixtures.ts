/**
 * Co-located test constants for WorkoutPreview.test.tsx.
 *
 * Extracted to silence `no-magic-numbers` lint warnings while keeping
 * assertion semantics identical. Values mirror the divisors and clamps
 * inside ./bar-height.ts and the visual stroke colors emitted by
 * ./WorkoutPreview.tsx.
 */
export const PREVIEW_TEST = {
  // Power zones
  POWER_ZONE_LOW: 1,
  POWER_ZONE_MID: 3,
  POWER_ZONE_MAX: 7,
  POWER_ZONE_DENOM: 7,
  // HR zones
  HR_ZONE_VAL: 2,
  HR_ZONE_DENOM: 5,
  // Pace zones
  PACE_ZONE_VAL: 3,
  PACE_ZONE_DENOM: 5,
  PACE_MPS_VAL: 4,
  PACE_MPS_DENOM: 6,
  PACE_RANGE_MIN: 3,
  PACE_RANGE_MAX: 5,
  PACE_RANGE_MID: 4,
  // Power units
  PERCENT_FTP_VAL: 100,
  PERCENT_FTP_DENOM: 150,
  WATTS_VAL: 200,
  WATTS_DENOM: 400,
  WATTS_RANGE_MIN: 100,
  WATTS_RANGE_MAX: 300,
  WATTS_RANGE_MID: 200,
  WATTS_OVER_MAX: 800,
  // Heart-rate units
  HR_BPM_VAL: 150,
  HR_BPM_DENOM: 200,
  HR_PERCENT_MAX_VAL: 80,
  HR_PERCENT_MAX_DENOM: 100,
  HR_RANGE_MIN: 120,
  HR_RANGE_MAX: 160,
  HR_RANGE_MID: 140,
  // Cadence units
  CADENCE_RPM_VAL: 90,
  CADENCE_RPM_DENOM: 120,
  CADENCE_RANGE_MIN: 60,
  CADENCE_RANGE_MAX: 100,
  CADENCE_RANGE_MID: 80,
  // Intensity heights / clamps
  MIN_HEIGHT_CLAMP: 0.15,
  REST_HEIGHT: 0.2,
  WARMUP_HEIGHT: 0.3,
  OPEN_FALLBACK_HEIGHT: 0.5,
  ACTIVE_HEIGHT: 0.6,
  MAX_HEIGHT_CLAMP: 1,
  // Step durations (seconds)
  DURATION_SHORT: 60,
  DURATION_MEDIUM: 120,
  DURATION_DEFAULT: 300,
  DURATION_LONG: 600,
  // Repeat counts
  REPEAT_TWICE: 2,
  REPEAT_THRICE: 3,
  REPEAT_FOUR: 4,
  // Expected bar counts
  BARS_FROM_TWO_STEPS: 2,
  BARS_FROM_REPEAT_3X2: 6,
  BARS_FROM_MIXED: 4,
  BARS_FROM_REPEAT_4X2: 8,
  BARS_EMPTY: 0,
  BARS_SINGLE: 1,
  UNIQUE_IDS_REPEAT_3: 3,
  // Selection stroke colors
  SELECTED_STROKE: "#2563eb",
  UNSELECTED_STROKE: "transparent",
} as const;
