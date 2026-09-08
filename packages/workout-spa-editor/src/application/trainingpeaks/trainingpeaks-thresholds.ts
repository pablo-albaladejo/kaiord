/**
 * Profile sport thresholds → the units `krdToTrainingPeaksWorkout` expects.
 *
 * TrainingPeaks wants every intensity as a percentage of a threshold, and the
 * converter divides KRD's absolute values by the numbers produced here. The
 * unit mismatch is the trap: the profile stores `thresholdPace` as a PACE
 * (minutes per km, or per 100 m for swimming) while KRD pace targets are a
 * SPEED in metres per second. Dividing one by the other without converting
 * yields plausible-looking nonsense rather than an error, so the conversion is
 * explicit and tested.
 */
import type { TrainingPeaksThresholds } from "@kaiord/trainingpeaks";
import type { z } from "zod";

import type { sportZonesRecordSchema } from "../../types/sport-zones-schemas";

type SportZonesRecord = z.infer<typeof sportZonesRecordSchema>;
type ZonedSport = keyof SportZonesRecord;

/**
 * The zone record is keyed by the four sports the editor configures zones for;
 * every other sport falls back to `generic`, which is what the zone editor
 * itself offers as the catch-all. Keyed by `string` because a persisted
 * `WorkoutRecord.sport` is a free string, not the narrowed KRD `Sport`.
 */
const ZONED_SPORT: Record<string, ZonedSport> = {
  cycling: "cycling",
  e_biking: "cycling",
  running: "running",
  walking: "running",
  hiking: "running",
  swimming: "swimming",
};

const SECONDS_PER_MINUTE = 60;
const METRES_PER_KM = 1000;
const METRES_PER_SWIM_UNIT = 100;

/** Minutes-per-distance → metres per second. Zero pace has no speed. */
export const paceToMetresPerSecond = (
  pace: number,
  unit: "min_per_km" | "min_per_100m"
): number | undefined => {
  if (pace <= 0) return undefined;
  const metres = unit === "min_per_km" ? METRES_PER_KM : METRES_PER_SWIM_UNIT;
  return metres / (pace * SECONDS_PER_MINUTE);
};

/**
 * Reads the thresholds for the workout's sport. `lthr` is a LACTATE threshold
 * heart rate, not a maximum, so it is deliberately not used as
 * `maxHeartRateBpm`; the profile-level `maxHeartRate` is passed in separately
 * by the caller, which owns the profile.
 */
export const toTrainingPeaksThresholds = (
  zones: SportZonesRecord | undefined,
  sport: string,
  maxHeartRate: number | undefined
): TrainingPeaksThresholds => {
  const key = ZONED_SPORT[sport] ?? "generic";
  const thresholds = zones?.[key]?.thresholds;
  const pace =
    thresholds?.thresholdPace !== undefined && thresholds.paceUnit !== undefined
      ? paceToMetresPerSecond(thresholds.thresholdPace, thresholds.paceUnit)
      : undefined;
  return {
    ftpWatts: thresholds?.ftp,
    maxHeartRateBpm: maxHeartRate,
    thresholdPaceMps: pace,
  };
};
