/**
 * Structured-KRD fixtures for the zone-profile derivations (test-only).
 *
 * Targets are expressed in `percent_ftp` so they classify with no athlete
 * thresholds at all — `thresholdsForSport(null, …)` answers `{}` and the
 * classifier still resolves a percentage. That keeps the zone assertions
 * independent of any profile fixture.
 *
 * Percentages are read against `POWER_MODEL.bounds` (0.55 / 0.75 / 0.90 /
 * 1.05), so 50 % is Z1, 65 % Z2, 82 % Z3, 98 % Z4 and 115 % Z5.
 */
import type { KRD, Workout } from "@kaiord/core";

export const PCT_Z1 = 50;
export const PCT_Z2 = 65;
export const PCT_Z3 = 82;
export const PCT_Z4 = 98;
export const PCT_Z5 = 115;

export const SHORT_STEP_SECONDS = 300;
export const LONG_STEP_SECONDS = 1200;

export type ZoneStepSpec = { percentFtp: number; seconds: number };

export function structuredWorkout(steps: ZoneStepSpec[]): Workout {
  return {
    name: "Fixture",
    sport: "cycling",
    steps: steps.map((step, index) => ({
      stepIndex: index,
      durationType: "time",
      duration: { type: "time", seconds: step.seconds },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "percent_ftp", value: step.percentFtp },
      },
    })),
  };
}

/** A KRD carrying the structured workout, which is all the readers look at. */
export function structuredKrd(steps: ZoneStepSpec[]): KRD {
  return {
    version: "1.0.0",
    type: "workout",
    metadata: { source: "fixture" },
    extensions: { structured_workout: structuredWorkout(steps) },
  } as unknown as KRD;
}

/** Warm-up, three threshold blocks with recoveries, cool-down — Z4 dominant. */
export const THRESHOLD_STEPS: ZoneStepSpec[] = [
  { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
  { percentFtp: PCT_Z4, seconds: LONG_STEP_SECONDS },
  { percentFtp: PCT_Z1, seconds: SHORT_STEP_SECONDS },
  { percentFtp: PCT_Z4, seconds: LONG_STEP_SECONDS },
  { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
];

/** One flat endurance block — Z2 dominant, one segment. */
export const ENDURANCE_STEPS: ZoneStepSpec[] = [
  { percentFtp: PCT_Z2, seconds: LONG_STEP_SECONDS },
];
