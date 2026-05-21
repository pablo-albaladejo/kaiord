/**
 * useGridReschedule — wires `usePointerDrag` to the
 * `rescheduleWorkout` use case backed by Dexie. The hook owns the
 * persistence call so the calendar grid only needs to read the
 * resulting `bind` / `dropTargetId` API.
 *
 * Failures are non-fatal: the optimistic UI reverts via the underlying
 * `useLiveQuery` re-fetch, and a static error toast surfaces a single
 * line of feedback. The toast first argument is the bare module-top
 * constant `TOAST_MOVE_WORKOUT_FAILED` so the `R-PIIInterpolation`
 * mechanical guard stays green.
 */

import { useCallback } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexieWorkoutRepository } from "../../../adapters/dexie/dexie-workout-repository";
import { rescheduleWorkout } from "../../../application/reschedule-workout";
import { useToastContext } from "../../../contexts/ToastContext";
import { usePointerDrag } from "./use-pointer-drag";

const TOAST_MOVE_WORKOUT_FAILED = "Could not move workout";

export function useGridReschedule() {
  const toast = useToastContext();

  const onDrop = useCallback(
    (workoutId: string, targetDayISO: string): void => {
      const repo = createDexieWorkoutRepository(db);
      rescheduleWorkout(repo, workoutId, targetDayISO).catch(() => {
        toast.error(TOAST_MOVE_WORKOUT_FAILED);
      });
    },
    [toast]
  );

  return usePointerDrag({ onDrop });
}
