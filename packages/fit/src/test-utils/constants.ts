// FIT test-utils numeric constants. Pure module: zero imports. Test fixtures only.

// === Time domain ===
export const TIME_TOLERANCE_MS = 1000 as const;
export const ONE_MIN_MS = 60000 as const;
export const FIFTY_FIVE_SEC_MS = 55000 as const;
export const TEN_MIN_MS = 600000 as const;
export const NINE_MIN_FORTY_SEC_MS = 580000 as const;
export const NINE_MIN_FIFTY_SEC_MS = 590000 as const;
export const TEN_MIN_SEC = 600 as const;
export const NINE_MIN_FORTY_SEC = 580 as const;
export const SECONDS_PER_MINUTE = 60 as const;

// === FIT timestamp roots ===
export const SAMPLE_TIMESTAMP_2024_01_01_SEC = 1704067200 as const;
export const SAMPLE_TIMESTAMP_2024_01_01_PLUS_1S = 1704067201 as const;
export const SAMPLE_TIMESTAMP_2024_01_01_PLUS_2S = 1704067202 as const;
export const SAMPLE_TIMESTAMP_2024_01_01_PLUS_10MIN_SEC = 1704067800 as const;

// === Sample HR/Cadence/Power/Speed/Elevation/Distance/Calories ===
export const SAMPLE_HR = { AVG: 145, MAX: 165 } as const;
export const SAMPLE_CADENCE = {
  AVG: 90,
  MAX: 100,
  AVG_FRACTIONAL: 90.5,
} as const;
export const SAMPLE_POWER = {
  AVG: 220,
  MAX: 350,
  NORMALIZED: 230,
  RECORD: 250,
} as const;
export const SAMPLE_SPEED = {
  AVG_BASE: 5.0,
  MAX_BASE: 7.0,
  AVG_ENHANCED: 5.5,
  MAX_ENHANCED: 7.5,
  RECORD: 3.5,
  RECORD_BASE: 3.0,
} as const;
export const SAMPLE_ELEVATION = {
  ASCENT_M: 150,
  DESCENT_M: 80,
  ALT_BASE_M: 100,
  ALT_ENHANCED_M: 105.5,
} as const;
export const SAMPLE_DISTANCE_M = 5000 as const;
export const SAMPLE_CALORIES = 250 as const;
export const SAMPLE_TEMPERATURE_C = 22 as const;

// === Running dynamics ===
export const SAMPLE_RUN_DYNAMICS = {
  VERT_OSC: 8.5,
  STANCE_TIME: 250,
  STEP_LENGTH: 1.2,
} as const;

// === GPS sample coordinates ===
export const COORD_BARCELONA = { LAT: 41.3851, LON: 2.1734 } as const;
export const COORD_BARCELONA_PRECISE = {
  LAT: 41.385064,
  LON: 2.173404,
} as const;
export const COORD_MADRID = { LAT: 40.416775, LON: -3.70379 } as const;
export const COORD_LONDON = { LAT: 51.507351, LON: -0.127758 } as const;
export const COORD_SYDNEY = { LAT: -33.86882, LON: 151.20929 } as const;
export const COORD_TOKYO = { LAT: 35.689487, LON: 139.691711 } as const;
export const COORD_ROUNDTRIP_TOKYO = { LAT: 35.6895, LON: 139.6917 } as const;
export const COORD_ROUNDTRIP_SYDNEY = { LAT: -33.8688, LON: 151.2093 } as const;

// === Coordinate boundary literals ===
export const LAT_MAX_DEG = 90 as const;
export const LON_MAX_DEG = 180 as const;
export const LAT_INVALID_DEG = 91 as const;
export const LON_INVALID_DEG = 181 as const;

// === Semicircle math ===
export const SEMICIRCLE_EXP = 31 as const;

// === Coordinate precision (toBeCloseTo decimals arg) ===
export const COORD_PRECISION_5 = 5 as const;
export const COORD_PRECISION_6 = 6 as const;

// === Workout step / swim ===
export const SAMPLE_WORKOUT_STEP_INDEX = 3 as const;
export const SAMPLE_NUM_LENGTHS = 4 as const;
export const SAMPLE_SWIM_STROKE_BREASTSTROKE = 2 as const;

// === Performance budget (record batch perf test) ===
export const PERF_RECORD_BATCH_SIZE = 10000 as const;
export const PERF_RECORD_BUDGET_MS = 500 as const;

// === Event-converter sample data ===
export const SAMPLE_EVENT_DATA = 42 as const;
export const SAMPLE_EVENT_TYPE_LAP = 3 as const;

// === Record batch sample size ===
export const RECORD_BATCH_SAMPLE_SIZE = 3 as const;

// === Numeric duration sample (used in invalid-type test) ===
export const NUMERIC_DURATION_TYPE_SAMPLE = 123 as const;
export const SECONDS_PER_MINUTE_SAMPLE = 60 as const;

// === FIT step counts and target zones ===
export const FIT_STEPS_COUNT_4 = 4 as const;
export const FIT_REPEAT_COUNT_3 = 3 as const;
export const FIT_TARGET_POWER_ZONE_3 = 3 as const;
export const FIT_REPEATED_MESSAGES_5 = 5 as const;
export const FIT_REPEATED_MESSAGES_6 = 6 as const;
export const FIT_FILE_TYPE_ACTIVITY = 4 as const;
export const FIT_FILE_TYPE_COURSE = 6 as const;

// === Pool length samples (also referenced in fit converter tests) ===
export const FIT_POOL_LENGTH_25 = 25 as const;
export const FIT_POOL_LENGTH_50 = 50 as const;
export const FIT_POOL_LENGTH_33_33 = 33.33 as const;

// === Workout step notes lengths (round-trip + krd-to-fit) ===
export const FIT_NOTES_OVERSIZED_LENGTH = 300 as const;
export const FIT_NOTES_MAX_LENGTH = 256 as const;

// === krd-to-fit watts/percent FTP scaling samples ===
export const FIT_TIME_300_SEC = 300 as const;
export const FIT_DURATION_VALUE_1000 = 1000 as const;
export const FIT_TARGET_VALUE_1200 = 1200 as const;
export const FIT_TARGET_VALUE_1250 = 1250 as const;
export const FIT_PERCENT_FTP_85 = 85 as const;
export const FIT_DURATION_CALORIES_10000 = 10000 as const;
export const FIT_DURATION_POWER_50 = 50 as const;
export const FIT_DURATION_POWER_1000 = 1000 as const;
export const FIT_TARGET_POWER_RANGE_LOW = 200 as const;
export const FIT_TARGET_POWER_RANGE_HIGH = 250 as const;

// === Session conversion samples ===
export const FIT_SESSION_TIMESTAMP_SEC = 1704067200 as const;
export const FIT_SESSION_TOTAL_ELAPSED_MS = 3600000 as const;
export const FIT_SESSION_TOTAL_TIMER_MS = 3500000 as const;
export const FIT_SESSION_TOTAL_ELAPSED_SEC = 3600 as const;
export const FIT_SESSION_TOTAL_TIMER_SEC = 3500 as const;
export const FIT_SESSION_AVG_HR = 145 as const;
export const FIT_SESSION_MAX_HR = 175 as const;
export const FIT_SESSION_MAX_POWER = 350 as const;
export const FIT_SESSION_NORMALIZED_POWER = 210 as const;
export const FIT_SESSION_TSS = 75.5 as const;
export const FIT_SESSION_INTENSITY_FACTOR = 0.85 as const;
export const FIT_SESSION_TOTAL_DESCENT = 450 as const;
export const FIT_SESSION_AVG_SPEED_BASE = 3.0 as const;
export const FIT_SESSION_MAX_SPEED_BASE = 4.0 as const;
export const FIT_SESSION_AVG_SPEED_ENHANCED = 3.5 as const;
export const FIT_SESSION_MAX_SPEED_ENHANCED = 4.5 as const;
export const FIT_SESSION_ROUND_TRIP_TOLERANCE_MS = 1000 as const;
