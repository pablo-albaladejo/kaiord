/**
 * Test fixtures for sync-zones.test.ts.
 * Pure constants — no logic, no functions.
 */

export const SYNC_ZONES_IDS = {
  profileId: "00000000-0000-0000-0000-000000000001",
  externalUserId: "99999",
  externalUserName: "Pablo",
  source: "train2go",
  now: "2026-04-28T10:00:00.000Z",
} as const;

export const SYNC_ZONES_VALUES = {
  weight: 83,
  bpmMax: 187,
  cyclingZ4Upper: 268,
  cyclingZ5Lower: 270,
  cyclingZ4UpperLow: 200,
  cyclingHrZ4Upper: 160,
  cyclingHrLthrLow: 150,
  runningHrZ4Upper: 168,
  runningHrLthrLow: 155,
  runningPaceZ4UpperMin: 4,
  runningPaceZ4UpperSec: 0,
  swimmingPaceZ4UpperMin: 1,
  swimmingPaceZ4UpperSec: 30,
  runningThresholdPace: 240,
  swimmingThresholdPace: 90,
  bodyWeightLow: 72,
  zeroValue: 0,
} as const;

export const SYNC_ZONES_REASONS = {
  transportError: "transport-error",
  shapeMismatch: "shape-mismatch",
  unsupported: "unsupported",
  profileDeleted: "profile-deleted",
  bridgeUnavailable: "Bridge unavailable",
} as const;

export const SYNC_ZONES_FIELDS = {
  cyclingFtp: "cycling.thresholds.ftp",
  cyclingLthr: "cycling.thresholds.lthr",
  runningLthr: "running.thresholds.lthr",
  bodyWeight: "bodyWeight",
} as const;
