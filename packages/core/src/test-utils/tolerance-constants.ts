/**
 * Round-trip tolerance constants.
 *
 * These values mirror the documented tolerances from CLAUDE.md:
 * time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm.
 *
 * Distance and pace tolerances are derived from the same domain
 * conventions used by the round-trip validator.
 *
 * Centralised so test files can reference named values instead of
 * sprinkling magic numbers across assertions.
 */

export const TOLERANCE_TIME_SEC = 1 as const;
export const TOLERANCE_POWER_WATTS = 1 as const;
export const TOLERANCE_HR_BPM = 1 as const;
export const TOLERANCE_CADENCE_RPM = 1 as const;
export const TOLERANCE_DISTANCE_M = 1 as const;
export const TOLERANCE_PACE_SEC_PER_M = 0.01 as const;

// === Buffer / arbitrary numeric literals used in tests ===
export const SAMPLE_BUFFER_LENGTH = 3 as const;
export const SAMPLE_BUFFER_BYTES = [1, 2, 3] as const;

// === Length-unit converter samples (yards <-> meters) ===
export const LENGTH_UNIT_YARDS_25_AS_METERS = 22.86 as const;
export const LENGTH_UNIT_YARDS_50_AS_METERS = 45.72 as const;
export const LENGTH_UNIT_YARDS_27_5_AS_METERS = 25.146 as const;
export const LENGTH_DECIMAL_METERS = 33.33 as const;

// === Pool length samples ===
export const POOL_LENGTH_25 = 25 as const;
export const POOL_LENGTH_50 = 50 as const;

// === Pace-tolerance edge values (used in tolerance-checker test) ===
export const PACE_EXPECTED_3_5 = 3.5 as const;
export const PACE_ACTUAL_3_52 = 3.52 as const;
export const PACE_DEVIATION_0_02 = 0.02 as const;
export const PACE_DEVIATION_PRECISION = 10 as const;
export const PACE_TOLERANCE_DEFAULT = 0.01 as const;

// === Faker numeric-string lengths ===
export const FAKER_SERIAL_NUMBER_DIGITS = 10 as const;

// === Target generator boundary widths ===
export const TARGET_RANGE_WIDTH_10 = 10 as const;
export const TARGET_PACE_RANGE_GAP_0_5 = 0.5 as const;

// === Profile snapshot constants ===
export const PROFILE_STALE_SNAPSHOT_DAYS = 7 as const;
export const PROFILE_SAMPLE_LTHR_RUNNING = 170 as const;
export const PROFILE_OVERSIZED_PAYLOAD_REPEAT = 9000 as const;

// === Workout step notes max length (KRD spec) ===
export const WORKOUT_STEP_NOTES_MAX_LENGTH = 256 as const;
