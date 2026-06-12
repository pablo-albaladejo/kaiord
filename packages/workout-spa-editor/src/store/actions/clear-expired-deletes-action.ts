/**
 * Clear Expired Deletes Action
 *
 * Action for removing expired deleted steps from tracking.
 */

import type { WorkoutState } from "../workout-actions";
import { UNDO_DELETE_WINDOW_MS } from "./delete-undo-constants";

export const clearExpiredDeletesAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  const deletedSteps = state.deletedSteps || [];
  const now = Date.now();

  const nonExpiredSteps = deletedSteps.filter(
    (d) => now - d.timestamp < UNDO_DELETE_WINDOW_MS
  );

  return {
    deletedSteps: nonExpiredSteps,
  };
};
