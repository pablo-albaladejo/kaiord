/**
 * Error Recovery Actions
 *
 * Actions for error recovery mechanisms including backup/restore and safe mode.
 *
 * Requirements:
 * - Requirement 36.5: Error recovery mechanisms
 */

import type { WorkoutStore } from "../workout-store-types";

/**
 * Create a backup of the current workout
 */
export const createBackupAction = (
  state: WorkoutStore
): Partial<WorkoutStore> => {
  if (!state.currentWorkout) {
    return {};
  }

  return {
    lastBackup: structuredClone(state.currentWorkout),
  };
};

/**
 * Restore workout from backup
 * Returns true if restore was successful, false if no backup exists
 */
export const restoreFromBackupAction = (
  state: WorkoutStore
): Partial<WorkoutStore> & { success?: boolean } => {
  if (!state.lastBackup) {
    return { success: false };
  }

  const restoredWorkout = structuredClone(state.lastBackup);

  return {
    currentWorkout: restoredWorkout,
    workoutHistory: [restoredWorkout],
    historyIndex: 0,
    success: true,
  };
};

/**
 * Enable safe mode - disables advanced features
 */
export const enableSafeModeAction = (): Partial<WorkoutStore> => {
  return {
    safeMode: true,
  };
};

/**
 * Disable safe mode - re-enables advanced features
 */
export const disableSafeModeAction = (): Partial<WorkoutStore> => {
  return {
    safeMode: false,
  };
};
