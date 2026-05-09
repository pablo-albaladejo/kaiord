// Pure literal constants for Garmin adapter tests.
// Zero imports — alias-only values; assertion outcomes are byte-identical.

// Pace m/s sample values (running pace zone boundaries / ranges).
export const PACE_M_PER_S = {
  Z3_MIN: 3.08,
  Z3_MAX: 3.51,
  RANGE_LOW: 3.5,
  RANGE_HIGH: 4.0,
} as const;

// Zone numeric values used in power / HR / pace zone assertions.
export const ZONE = {
  Z3: 3,
  Z4: 4,
} as const;

// Cadence sample values (rpm).
export const CADENCE_RPM = {
  LOW: 95,
  HIGH: 105,
} as const;

// Power sample values (watts) used in target ordering tests.
export const POWER_W = {
  RANGE_LOW: 260,
  RANGE_HIGH: 273,
} as const;

// Pool length sample (meters).
export const POOL_LENGTH_METERS = {
  STANDARD: 25,
} as const;

// Workout step / repetition counts used in characterization tests.
export const REPETITION = {
  COUNT_3: 3,
  COUNT_4: 4,
  COUNT_5: 5,
  COUNT_7: 7,
  COUNT_8: 8,
} as const;

// Multisport workout segment counts.
export const SEGMENT_COUNT = {
  TRIATHLON: 3,
} as const;

// Flattened-step / mixed-step result counts in characterization tests.
export const STEP_COUNT = {
  WARMUP_REPEAT_COOLDOWN: 3,
} as const;

// Garmin protocol stepType displayOrder for the "repeat" step type.
export const STEP_TYPE = {
  REPEAT_DISPLAY_ORDER: 6,
} as const;

// Workout name truncation limit (Garmin protocol).
export const WORKOUT_NAME_MAX_LENGTH = 255;

// Description / notes truncation limit (Garmin protocol).
export const NOTES_MAX_LENGTH = 256;

// Input length used in description-truncation test fixtures (above NOTES_MAX_LENGTH).
export const NOTES_OVERSIZED_INPUT_LENGTH = 300;

// Generic stepIndex sample value used in assertions.
export const STEP_INDEX = {
  FIVE: 5,
} as const;

// stepOrder counter sample values used by repetition characterization tests.
export const STEP_ORDER = {
  COUNTER_FIVE: 5,
  COUNTER_EIGHT: 8,
} as const;
