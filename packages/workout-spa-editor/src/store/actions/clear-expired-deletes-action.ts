/**
 * Clear Expired Deletes Action
 *
 * Action for removing expired deleted steps from tracking.
 */

import type { WorkoutState } from "../workout-actions";

export const clearExpiredDeletesAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  const deletedSteps = state.deletedSteps || [];
  const now = Date.now();
  const EXPIRY_TIME = 5000; // 5 seconds

  const nonExpiredSteps = deletedSteps.filter(
    (d) => now - d.timestamp < EXPIRY_TIME
  );

  return {
    deletedSteps: nonExpiredSteps,
  };
};
