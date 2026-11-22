import { krdToTrainingPeaksWorkout } from "@kaiord/trainingpeaks";

import { toTrainingPeaksThresholds } from "../application/trainingpeaks/trainingpeaks-thresholds";
import type { WorkoutRecord } from "../types/calendar-record";
import type { useActiveProfileLive } from "./use-active-profile-live";

type Profile = NonNullable<ReturnType<typeof useActiveProfileLive>>["profile"];

/** The POST body for `workout`, on its own day, for the probed athlete. */
export const buildTrainingPeaksPayload = (
  workout: WorkoutRecord & { krd: NonNullable<WorkoutRecord["krd"]> },
  athleteId: number,
  profile: Profile | null
): Record<string, unknown> => ({
  ...krdToTrainingPeaksWorkout(workout.krd, {
    athleteId,
    workoutDay: workout.date,
    thresholds: toTrainingPeaksThresholds(
      profile?.sportZones,
      workout.sport,
      profile?.maxHeartRate
    ),
  }),
});
