/**
 * Test fixtures for workout-stats-helpers.test.ts.
 * Pure constants — no logic, no functions.
 */

export const STATS_TIME_SECONDS = {
  thirty: 30,
  sixty: 60,
  oneHundredEighty: 180,
  oneHundredTwenty: 120,
  threeHundred: 300,
} as const;

export const STATS_DISTANCE_METERS = {
  twoHundred: 200,
  fourHundred: 400,
  oneThousand: 1000,
} as const;

export const STATS_POWER_WATTS = {
  oneFifty: 150,
  twoHundred: 200,
  twoTwenty: 220,
  twoFifty: 250,
  threeHundred: 300,
} as const;

export const STATS_PACE_MIN_PER_KM = {
  four: 4,
  five: 5,
  six: 6,
} as const;

export const STATS_HEART_RATE_BPM = {
  oneForty: 140,
  oneFifty: 150,
} as const;

export const STATS_REPEAT_COUNTS = {
  zero: 0,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  ten: 10,
} as const;
