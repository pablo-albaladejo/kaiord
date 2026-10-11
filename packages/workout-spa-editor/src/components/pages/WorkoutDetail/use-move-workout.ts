import { useCallback } from "react";

import {
  rescheduleWorkout,
  WorkoutNotFoundError,
} from "../../../application/reschedule-workout";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";

/**
 * Moves a workout to another day through `rescheduleWorkout`, the same use
 * case the calendar drag runs. A workout deleted meanwhile is a toast: the
 * live record query already turns the page into "not found".
 */
export function useMoveWorkout() {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("workout-detail");

  return useCallback(
    async (workoutId: string, date: string) => {
      try {
        await rescheduleWorkout(persistence, workoutId, date);
        toast.success(t("move.done"));
      } catch (error) {
        if (!(error instanceof WorkoutNotFoundError)) throw error;
        toast.error(t("move.notFound"));
      }
    },
    [persistence, toast, t]
  );
}
