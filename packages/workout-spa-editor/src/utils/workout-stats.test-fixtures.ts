/**
 * Test fixtures for workout-stats.test.ts.
 *
 * Co-located fixture module — pure constants only.
 */

// Simple time-based scenario expected total seconds.
export const TIME_STATS_TOTAL_SECONDS = 900;

// Distance-based scenario expected total meters.
export const DISTANCE_STATS_TOTAL_METERS = 3000;

// Step-duration vocabulary (seconds) reused across scenarios.
export const STEP_SECONDS = {
  warmup: 300,
  short: 60,
  medium: 120,
  long: 600,
  sprint: 30,
  recovery: 90,
} as const;

// Repetition counts reused across scenarios.
export const REPEAT_COUNTS = {
  doubled: 2,
  tripled: 3,
  fivefold: 5,
} as const;

// Power target watts vocabulary reused across scenarios.
export const POWER_TARGETS_W = {
  easy: 100,
  zone2: 150,
  threshold: 200,
  vo2: 250,
  sprint: 300,
} as const;

// Distance meters vocabulary reused across scenarios.
export const DISTANCE_METERS = {
  short: 1000,
  medium: 2000,
  long: 5000,
} as const;

// Pace targets (min_per_km) vocabulary.
export const PACE_TARGETS = {
  fast: 4,
  steady: 5,
} as const;

// Expected step counts.
export const EXPECTED_STEP_COUNTS = {
  complexNested: 8,
  multipleRepeats: 5,
  fullPyramid: 13,
} as const;
