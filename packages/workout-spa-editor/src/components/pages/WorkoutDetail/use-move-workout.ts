import { useCallback, useMemo } from "react";

import {
  moveSession,
  SessionNotMovableError,
  WorkoutNotFoundError,
} from "../../../application/move-session";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { useGarminDriftToast } from "../session-move/use-garmin-drift-toast";

const nowIso = () => new Date().toISOString();

/**
 * Moves a workout to another day through `moveSession`, the same use case
 * the calendar drag runs. A done session and a workout deleted meanwhile are
 * toasts, never a rejection: the live record query already turns the page
 * into "not found". When Garmin still holds the old day, the drift toast
 * replaces the confirmation.
 */
export function useMoveWorkout() {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("workout-detail");
  const getPersistence = useMemo(() => () => persistence, [persistence]);
  const notifyDrift = useGarminDriftToast(getPersistence);

  return useCallback(
    async (workoutId: string, date: string) => {
      try {
        await moveSession(
          { ...persistence, now: nowIso },
          { workoutId, targetDay: date }
        );
        const drifted = await notifyDrift(workoutId).catch(() => false);
        if (!drifted) toast.success(t("move.done"));
      } catch (error) {
        if (error instanceof SessionNotMovableError) {
          if (error.reason === "executed")
            toast.error(t("move.blockedExecuted"));
          else toast.error(t("move.blockedCompleted"));
          return;
        }
        if (!(error instanceof WorkoutNotFoundError)) throw error;
        toast.error(t("move.notFound"));
      }
    },
    [persistence, toast, t, notifyDrift]
  );
}
