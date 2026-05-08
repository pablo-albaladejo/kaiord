/**
 * Zone Fixtures (test-only)
 *
 * Shared fixture module for ZoneEditor + zone calculator tests. Lives under
 * `test-utils/` which is exempt from the `no-magic-numbers` rule per the repo
 * eslint flat config; the named exports below are pure test data with no
 * runtime semantics outside *.test.{ts,tsx} files.
 */

import type { HeartRateZone, PowerZone } from "../types/profile";
import type { PaceZone } from "../types/sport-zones";

// HR zone fixture matching legacy inline `hrZones` (3 zones).
export const HR_ZONES_3: Array<HeartRateZone> = [
  { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Z2", minBpm: 131, maxBpm: 160 },
  { zone: 3, name: "Z3", minBpm: 161, maxBpm: 190 },
];

// Power zone fixture matching legacy inline `powerZones` (3 zones).
export const POWER_ZONES_3: Array<PowerZone> = [
  { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
];

// Pace zone fixture matching legacy inline `paceZones` (2 zones, min_per_km).
export const PACE_ZONES_2: Array<PaceZone> = [
  { zone: 1, name: "Z1", minPace: 360, maxPace: 420, unit: "min_per_km" },
  { zone: 2, name: "Z2", minPace: 300, maxPace: 359, unit: "min_per_km" },
];

// Threshold scenario constants.
export const FTP_DEFAULT_WATTS = 250;
export const FTP_ALT_WATTS = 300;
export const LTHR_DEFAULT_BPM = 170;
export const PACE_THRESHOLD_DEFAULT_SEC = 300;

// HR input bpm scenarios.
export const HR_INPUT_BPM_110 = 110;
export const HR_INPUT_BPM_140 = 140;
export const HR_INPUT_BPM_125 = 125;
export const HR_INPUT_BPM_180 = 180;
export const HR_INPUT_BPM_170 = 170;
export const HR_INPUT_BPM_90 = 90;
export const HR_INPUT_BPM_200 = 200;

// Power watt input scenarios.
export const WATTS_INPUT_150 = 150;
export const WATTS_INPUT_200 = 200;
export const WATTS_INPUT_285 = 285;

// Percent inputs.
export const PERCENT_INPUT_80 = 80;

// mm:ss-derived total seconds.
export const MM_SS_INPUT_5_30_SEC = 330;
export const MM_SS_INPUT_7_30_SEC = 450;

// Expected percent outputs.
export const EXPECTED_PERCENT_50 = 50;
export const EXPECTED_PERCENT_80 = 80;
export const EXPECTED_PERCENT_114 = 114;

// Cascade expectations (HR/pace).
export const EXPECTED_CASCADE_NEXT_BPM_141 = 141;
export const EXPECTED_CASCADE_PREV_BPM_124 = 124;
export const EXPECTED_CASCADE_PACE_NEXT_SEC_451 = 451;
export const EXPECTED_CASCADE_HR_180_TRIO = {
  z2Min: 181,
  z2Max: 182,
  z3Min: 183,
} as const;

// Coggan FTP=250 expected outputs (3 first zones).
export const COGGAN_FTP_250_OUTPUTS = {
  z1: { min: 0, max: 138 },
  z2: { min: 139, max: 188 },
  z3: { min: 189, max: 225 },
} as const;

// British Cycling 6-zone FTP=300 expected Z1 max watts.
export const BRITISH_CYCLING_FTP_300_Z1_MAX = 180;

// Karvonen LTHR=170 expected outputs (Z1 max / Z2 min).
export const KARVONEN_LTHR_170_OUTPUTS = {
  z1Max: 139,
  z2Min: 140,
} as const;

// Friel HR LTHR=170 expected Z1 max bpm.
export const FRIEL_LTHR_170_Z1_MAX = 138;

// Zone count expectations.
export const ZONE_LENGTH_3 = 3;
export const ZONE_LENGTH_5 = 5;
export const ZONE_LENGTH_6 = 6;
export const ZONE_LENGTH_7 = 7;

// Zone index helpers.
export const ZONE_INDEX_0 = 0;
export const ZONE_INDEX_1 = 1;
export const ZONE_INDEX_2 = 2;
