/**
 * Application-layer test fixtures.
 *
 * Test-only fixture module exempt from `no-magic-numbers` via the eslint flat
 * config `**\/test-utils\/**` ignore. Provides named semantic constants for:
 *
 *  - duration-as-seconds literals used by `compute-compliance-score` and
 *    `parse-coaching-duration` tests
 *  - compliance / coaching expected outputs
 *  - cost-estimation token + USD-per-million-token rates
 *  - HR / Power / Pace band tables and percent-FTP outputs used by the
 *    `sync-zones-bands` test suite
 *
 * Import sites: `application/compute-compliance-score.test.ts`,
 * `application/parse-coaching-duration.test.ts`,
 * `application/cost-estimation.test.ts`,
 * `application/coaching/sync-zones-bands.test.ts`.
 */

// ---------------------------------------------------------------------------
// (a) DURATION_SEC group — duration-as-seconds literals.
// ---------------------------------------------------------------------------
export const MINUTES_45_AS_SEC = 2700;
export const MINUTES_43_AS_SEC = 2580;
export const MINUTES_47_AS_SEC = 2820;
export const HOUR_AS_SEC = 3600;
export const HOUR_AND_HALF_AS_SEC = 5400;
export const TWO_HOURS_AS_SEC = 7200;
export const MINUTE_AS_SEC = 60;
export const THIRTY_MINUTES_AS_SEC = 1800;
export const TEN_MINUTES_AS_SEC = 600;
export const HUNDRED_MINUTES_AS_SEC = 6000;

// ---------------------------------------------------------------------------
// (b) COMPLIANCE expected outputs.
// ---------------------------------------------------------------------------
export const COMPLIANCE_HIT_TARGET = 0.956;
export const COMPLIANCE_HIT_TARGET_PRECISION = 2;
export const COMPLIANCE_HALF = 0.5;
export const COMPLIANCE_ZERO = 0;

// ---------------------------------------------------------------------------
// (c) COST_ESTIMATION fixtures.
// ---------------------------------------------------------------------------
export const DESCRIPTION_LEN_300 = 300;
export const COMMENT_LEN_150 = 150;
export const DESCRIPTION_LEN_600 = 600;
export const DESCRIPTION_LEN_10 = 10;
export const EXPECTED_TOKENS_300_CHARS = 600;
export const EXPECTED_TOKENS_300_PLUS_150 = 650;
export const EXPECTED_TOKENS_900_CHARS = 1300;
export const EXPECTED_TOKENS_BASELINE_PLUS_10 = 504;
export const EXPECTED_TOKENS_ZERO = 0;
export const ONE_MILLION_TOKENS = 1_000_000;
export const RATE_USD_PER_MTOK_3 = 3.0;
export const RATE_USD_PER_MTOK_10 = 10.0;
export const RATE_USD_PER_MTOK_5 = 5.0;
export const EXPECTED_COST_USD_3 = 3.0;
export const EXPECTED_COST_USD_FRACTIONAL = 0.005;
export const TOKENS_500 = 500;
export const TOKENS_ZERO = 0;

// ---------------------------------------------------------------------------
// (d) SYNC_ZONES_BANDS fixtures — HR / Power / Pace band tables.
// ---------------------------------------------------------------------------
export const HR_GENERIC_BANDS = {
  z1: { lower: 107, upper: 133 },
  z2: { lower: 134, upper: 147 },
  z3: { lower: 148, upper: 160 },
  z4: { lower: 161, upper: 174 },
  z5: { lower: 175, upper: 187 },
} as const;

export const HR_RUNNING_BANDS = {
  z1: { lower: 100, upper: 130 },
  z2: { lower: 131, upper: 145 },
  z3: { lower: 146, upper: 157 },
  z4: { lower: 158, upper: 168 },
  z5: { lower: 169, upper: 180 },
} as const;

export const POWER_BANDS = {
  z1: { lower: 111, upper: 149 },
  z2: { lower: 150, upper: 203 },
  z3: { lower: 204, upper: 239 },
  z4: { lower: 240, upper: 268 },
  z5: { lower: 269, upper: 386 },
} as const;

export const RUN_PACE_BANDS = {
  z4: {
    lower: { min: 4, sec: 44 },
    upper: { min: 4, sec: 10 },
  },
} as const;

export const RUN_PACE_Z4_UPPER = { min: 4, sec: 10 } as const;

export const PHYSIOLOGICAL_TRIATHLETE = {
  weight: 83,
  bpmMax: 187,
  bpmRest: 51,
} as const;

export const BPM_REST_51 = 51;
export const FTP_DIVISOR_268 = 268;
export const Z5_LOWER_269 = 269;
export const LTHR_CYCLING_174 = 174;
export const LTHR_RUNNING_168 = 168;
export const Z4_MIN_PERCENT_90 = 90;
export const Z4_MAX_PERCENT_100 = 100;
export const Z1_MIN_PERCENT_41 = 41;
export const Z1_MAX_PERCENT_56 = 56;
export const PACE_Z4_MIN_SEC_250 = 250;
export const PACE_Z4_MAX_SEC_284 = 284;
export const POWER_ZONES_LENGTH_5 = 5;
export const HR_ZONES_LENGTH_5 = 5;
export const Z3_INDEX = 3;
export const Z1_INDEX = 0;

export const MANUAL_HR_BANDS_PRESYNC = [
  { zone: 1, name: "Recovery", minBpm: 107, maxBpm: 133 },
  { zone: 2, name: "Aerobic", minBpm: 131, maxBpm: 145 },
  { zone: 3, name: "Tempo", minBpm: 148, maxBpm: 160 },
  { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 170 },
  { zone: 5, name: "VO2 Max", minBpm: 175, maxBpm: 187 },
] as const;

export const Z4_MAXBPM_ACCEPTED_174 = 174;
export const Z2_MAXBPM_REJECTED_145 = 145;
export const MAP_GET_Z1_MINBPM_107 = 107;
export const MAP_GET_Z5_MAXBPM_187 = 187;
export const MAP_GET_Z3_MINBPM_148 = 148;
export const MAP_GET_Z4_MAXBPM_174 = 174;
