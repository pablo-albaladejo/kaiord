/**
 * What the athlete confirms before a Regenerate: their hand edits are
 * replaced, and a Workout on the watch goes back to Ready while the earlier
 * version stays in Garmin's library. Nothing to confirm, no confirmation.
 */
import type { WorkoutRecord } from "../../types/calendar-record";
import type { WorkoutState } from "../../types/calendar-schemas";
import { hasHandEdits } from "../stale-resolution";

export type RegenerateWarnings = { edited: boolean; onWatch: boolean };

export const regenerateWarnings = (
  workout: WorkoutRecord,
  placedOnGarmin: boolean
): RegenerateWarnings => ({
  edited: hasHandEdits(workout),
  onWatch:
    placedOnGarmin ||
    workout.garminPushId !== null ||
    workout.state === "pushed" ||
    workout.state === "modified",
});

/** A Workout not yet built (raw) or set aside (skipped) has nothing to rebuild. */
export const canRegenerate = (state: WorkoutState): boolean =>
  state !== "raw" && state !== "skipped";
