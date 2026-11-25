/**
 * Stale Conflict Resolution
 *
 * Determines whether a stale workout has user edits that
 * conflict with updated raw content, and resolves conflicts.
 */

import type { WorkoutState } from "../types/calendar-enums";
import type { WorkoutRecord } from "../types/calendar-record";

/**
 * Whether the athlete edited the Workout by hand since it was built: any
 * edit when no AI built it, else an edit after the AI's run.
 */
export const hasHandEdits = (
  workout: Pick<WorkoutRecord, "aiMeta" | "modifiedAt">
): boolean => {
  if (!workout.aiMeta) {
    return workout.modifiedAt !== null;
  }

  return (
    workout.modifiedAt !== null &&
    workout.modifiedAt > workout.aiMeta.processedAt
  );
};

export const hasConflict = (workout: WorkoutRecord): boolean =>
  workout.state === "stale" && hasHandEdits(workout);

export const keepUserVersion = (workout: WorkoutRecord): WorkoutRecord => {
  if (workout.state !== "stale" || !workout.previousState) {
    throw new Error("Can only keep user version on a stale workout");
  }

  return {
    ...workout,
    state: workout.previousState as WorkoutState,
    previousState: null,
    updatedAt: new Date().toISOString(),
  };
};
