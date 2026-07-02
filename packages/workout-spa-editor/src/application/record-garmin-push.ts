/**
 * Persists the outcome of a confirmed Garmin push onto a WorkoutRecord.
 *
 * Reuses the legal ready|modified → pushed transition when applicable;
 * any other state keeps its state and only records the push id, so the
 * calendar lifecycle badge (`pushedToGarmin`) reflects reality for every
 * push entry point. `modifiedAt` is NOT advanced — a push is not a KRD
 * edit (spa-workout-state-machine).
 */
import type { WorkoutRecord } from "../types/calendar-record";
import { transitionToPushed } from "./workout-transitions";

export const recordGarminPush = (
  workout: WorkoutRecord,
  garminPushId: string
): WorkoutRecord => {
  if (workout.state === "ready" || workout.state === "modified") {
    return transitionToPushed(workout, garminPushId);
  }
  return { ...workout, garminPushId, updatedAt: new Date().toISOString() };
};
