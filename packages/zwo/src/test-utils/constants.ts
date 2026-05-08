// Test-only constants for ZWO converter tests. Named keys replace inline
// magic numbers to satisfy no-magic-numbers without altering assertions.

export const PACE_SECONDS_PER_KM = {
  VERY_FAST: 180,
  FAST: 240,
  MODERATE: 300,
  SLOW: 360,
  EASY: 600,
} as const;

export const PACE_METERS = {
  KILOMETER: 1000,
} as const;

export const SPEED_MPS = {
  PACE_4_167: 4.167,
  PACE_2_778: 2.778,
  PACE_5_556: 5.556,
  PACE_3_333: 3.3333333333333335,
  PACE_4_167_FULL: 4.166666666666667,
  PACE_2_778_FULL: 2.7777777777777777,
} as const;

export const INTENSITY_RATIO = {
  HALF: 0.5,
  SIXTY: 0.6,
  SEVENTY_FIVE: 0.75,
  EIGHTY: 0.8,
  EIGHTY_FIVE: 0.85,
  ONE_AND_HALF: 1.5,
  TRIPLE: 3.0,
} as const;

export const PERCENT_FTP = {
  FIFTY: 50,
  SIXTY: 60,
  SEVENTY_FIVE: 75,
  EIGHTY: 80,
  EIGHTY_FIVE: 85,
  ONE_FIFTY: 150,
  THREE_HUNDRED: 300,
} as const;

export const CADENCE_RPM = {
  LOW: 60,
  MED: 80,
  REST: 85,
  HIGH: 90,
  RACE: 120,
  RUN_LOW: 160,
  RUN_HIGH: 200,
} as const;

export const CADENCE_SPM = {
  STANDARD: 180,
} as const;

export const DURATION_SECONDS = {
  ONE_MIN_30S: 90,
  TWO_MIN: 120,
  TWO_MIN_DECIMAL: 120.5,
  FIVE_MIN: 300,
  TEN_MIN: 600,
  THIRTY_MIN_AS_2K: 2000,
  NEG_TEN: -10,
  NEG_FIFTY: -50,
} as const;

export const DISTANCE_METERS = {
  HALF_KM_DECIMAL: 500.5,
  ONE_KM: 1000,
  TWO_KM: 2000,
  NEG_HUNDRED: -100,
} as const;

export const PARSER_NUMERICS = {
  ID_1234: 1234,
  THRESHOLD_SEC_PER_KM: 240,
  STEP_COUNT_4: 4,
} as const;
