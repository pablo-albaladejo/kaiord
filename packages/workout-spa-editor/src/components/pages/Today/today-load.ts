/**
 * Pure load-proxy helpers for the Today week strip.
 *
 * A day's training load is the summed TSS of its planned workouts when a KRD
 * is present; otherwise it falls back to estimated minutes so unprocessed
 * (raw) entries still register a bar. Heights are normalised to the week's
 * busiest day so the tallest bar fills the track.
 */
import {
  buildReviewModel,
  type ReviewModel,
} from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Profile } from "../../../types/profile";
import type { SportThresholds } from "../../../types/sport-zones";

const FALLBACK_TITLE = "Workout";
const RAW_FALLBACK_LOAD = 30;
const MIN_BAR_FRACTION = 0.12;

type SportZoneKey = keyof Profile["sportZones"];

export function reviewFor(
  record: WorkoutRecord,
  profile: Profile | null
): ReviewModel | null {
  if (!record.krd) return null;
  const sportKey = record.sport as SportZoneKey;
  const thresholds: SportThresholds =
    profile?.sportZones[sportKey]?.thresholds ?? {};
  return buildReviewModel(record.krd, thresholds, FALLBACK_TITLE);
}

export function recordLoad(
  record: WorkoutRecord,
  profile: Profile | null
): number {
  return reviewFor(record, profile)?.tss ?? RAW_FALLBACK_LOAD;
}

/** Maps each day's raw load to a 0..1 bar fraction against the week max. */
export function normaliseLoads(loads: number[]): number[] {
  const max = Math.max(0, ...loads);
  if (max <= 0) return loads.map(() => 0);
  return loads.map((load) =>
    load <= 0 ? 0 : Math.max(MIN_BAR_FRACTION, load / max)
  );
}

/** Bar fraction per ISO day, summing each day's workout loads then normalising. */
export function weekLoadFractions(
  dayIsos: string[],
  workouts: WorkoutRecord[],
  profile: Profile | null
): number[] {
  const raw = dayIsos.map((iso) =>
    workouts
      .filter((w) => w.date === iso)
      .reduce((sum, w) => sum + recordLoad(w, profile), 0)
  );
  return normaliseLoads(raw);
}
