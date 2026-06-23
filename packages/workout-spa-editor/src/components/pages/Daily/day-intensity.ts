/** Intensity-bucket reducers for a day's workouts (measured TSS) and coaching
    activities (estimated effort), used by the WeekStrip per-day summary. */
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import {
  effortBucket,
  type IntensityBucket,
  maxBucket,
  tssBucket,
} from "./intensity-bucket";
import { reviewFor } from "./today-load";

export function measuredBucket(
  workouts: WorkoutRecord[],
  profile: Profile | null
): IntensityBucket | null {
  let bucket: IntensityBucket | null = null;
  for (const w of workouts) {
    const tss = reviewFor(w, profile)?.tss;
    if (typeof tss === "number") {
      bucket = bucket ? maxBucket(bucket, tssBucket(tss)) : tssBucket(tss);
    }
  }
  return bucket;
}

export function estimatedBucket(
  activities: CoachingActivity[]
): IntensityBucket | null {
  let bucket: IntensityBucket | null = null;
  for (const a of activities) {
    if (a.effort) {
      const next = effortBucket(a.effort);
      bucket = bucket ? maxBucket(bucket, next) : next;
    }
  }
  return bucket;
}
