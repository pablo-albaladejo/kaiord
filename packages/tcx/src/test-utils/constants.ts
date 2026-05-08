// TCX test-utils numeric constants. Pure module: zero imports. Test fixtures only.

// === Time durations (seconds) ===
export const TIME_SECONDS_300 = 300 as const;
export const TIME_SECONDS_1800 = 1800 as const;
export const TIME_SECONDS_7200 = 7200 as const;

// === Distance durations (meters) ===
export const DISTANCE_METERS_1000 = 1000 as const;
export const DISTANCE_METERS_5000 = 5000 as const;
export const DISTANCE_METERS_MILE = 1609.34 as const;

// === Heart rate / power values ===
export const HEART_RATE_ZONE_THREE = 3 as const;
export const POWER_WATTS_250 = 250 as const;

// === Step counts ===
export const STEP_COUNT_THREE = 3 as const;

// === Step indices / IDs ===
export const STEP_INDEX_FOUR = 4 as const;
export const STEP_ID_FIVE = 5 as const;
export const STEP_INDEX_FIVE = 5 as const;

// === Misc invalid value sentinels ===
export const INVALID_NUMERIC_DURATION_TYPE = 123 as const;
