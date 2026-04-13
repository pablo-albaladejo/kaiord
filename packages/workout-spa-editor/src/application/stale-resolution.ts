/**
 * Stale Conflict Resolution
 *
 * Determines whether a stale workout has user edits that
 * conflict with updated raw content, and resolves conflicts.
 */

import type { WorkoutState } from "../types/calendar-enums";
import type { WorkoutRecord } from "../types/calendar-record";

export const hasConflict = (workout: WorkoutRecord): boolean => {
  if (workout.state !== "stale") return false;

  if (!workout.aiMeta) {
    return workout.modifiedAt !== null;
  }

  return (
    workout.modifiedAt !== null &&
    workout.modifiedAt > workout.aiMeta.processedAt
  );
};

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
