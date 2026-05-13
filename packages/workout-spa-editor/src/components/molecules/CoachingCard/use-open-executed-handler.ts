/**
 * Bridges the dialog's `onOpenExecuted` callback to the parent so a
 * click on an executed-row in `ExecutedWorkoutsSection` closes the
 * coaching dialog first, then opens the recorded workout the same way
 * a solo `WorkoutCard` click would. Returns a stable no-op when the
 * parent does not wire `onOpenExecuted`, keeping the section harmless.
 */

import { useCallback } from "react";

import type { WorkoutRecord } from "../../../types/calendar-record";

export const useOpenExecutedHandler = (
  onClose: () => void,
  onOpenExecuted: ((workout: WorkoutRecord) => void) | undefined
): ((workout: WorkoutRecord) => void) =>
  useCallback(
    (workout: WorkoutRecord) => {
      if (!onOpenExecuted) return;
      onClose();
      onOpenExecuted(workout);
    },
    [onClose, onOpenExecuted]
  );
