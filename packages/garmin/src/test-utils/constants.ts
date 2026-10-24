// Pure literal constants for Garmin adapter tests.
// Zero imports — alias-only values; assertion outcomes are byte-identical.

// Pace m/s sample values (running pace zone boundaries / ranges).
export const PACE_M_PER_S = {
  Z3_MIN: 3.08,
  Z3_MAX: 3.51,
  RANGE_LOW: 3.5,
  RANGE_HIGH: 4.0,
  // Single 4:45 min/km value and its ±5 s/km Garmin band (4:40..4:50).
  SINGLE_4_45: 1000 / 285,
  BAND_4_40: 1000 / 280,
  BAND_4_50: 1000 / 290,
  // paceValueSchema cap; a band around it must not exceed it on re-import.
  SCHEMA_MAX: 30,
} as const;

// Single-value power / HR / cadence tolerance bands (integer bounds).
// Power: ±5 % but at least ±5 W; HR and cadence: ±3. Capped at the KRD
// schema maxima (5000 W, 300 bpm, 300 rpm) and floored at 0.
export const TARGET_BAND = {
  POWER_W: 200,
  POWER_LOW_W: 190,
  POWER_HIGH_W: 210,
  SMALL_POWER_W: 80,
  SMALL_POWER_LOW_W: 75,
  SMALL_POWER_HIGH_W: 85,
  POWER_SCHEMA_MAX_W: 5000,
  HR_BPM: 150,
  HR_LOW_BPM: 147,
  HR_HIGH_BPM: 153,
  HR_NEAR_MAX_BPM: 299,
  HR_NEAR_MAX_LOW_BPM: 296,
  SCHEMA_MAX_BPM: 300,
  HR_NEAR_ZERO_BPM: 2,
  HR_NEAR_ZERO_HIGH_BPM: 5,
  CADENCE_RPM: 90,
  CADENCE_LOW_RPM: 87,
  CADENCE_HIGH_RPM: 93,
  SCHEMA_MAX_RPM: 300,
} as const;

// Decimal digits for float comparisons of converted speeds.
export const FLOAT_DIGITS = 9;

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

// percent_ftp → watts resolution samples: round(pct / 100 × ftp).
export const FTP_RESOLUTION = {
  FTP_W: 250,
  SWEET_SPOT_PCT: 85,
  SWEET_SPOT_W: 213,
  // 213 W ± 5 % (10.65 W), rounded: what Garmin receives for a single 213 W.
  SWEET_SPOT_BAND_LOW_W: 202,
  SWEET_SPOT_BAND_HIGH_W: 224,
  ODD_FTP_W: 263,
  HALF_PCT: 50,
  HALF_OF_ODD_FTP_W: 132,
  NEGATIVE_FTP_W: -200,
  STEADY_W: 240,
  STEADY_BAND_LOW_W: 228,
  STEADY_BAND_HIGH_W: 252,
  RANGE_LOW_W: 125,
  RANGE_HIGH_W: 188,
  // A 50-75 % FTP warm-up ramp; at FTP_W it resolves to RANGE_LOW/HIGH_W.
  RAMP_LOW_PCT: 50,
  RAMP_HIGH_PCT: 75,
  // Half-watt boundaries where `pct / 100 * ftp` lands a hair below .5
  // in floating point and would round down; `pct * ftp / 100` does not.
  BOUNDARY_CASES: [
    { pct: 35, ftpWatts: 330, watts: 116 },
    { pct: 57, ftpWatts: 150, watts: 86 },
  ],
} as const;
