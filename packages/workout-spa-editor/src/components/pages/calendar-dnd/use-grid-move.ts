/**
 * The calendar move's write: `moveSession` over the given persistence.
 * Failures are non-fatal: the card stays where the live query has it, and a
 * static toast gives one line of feedback, naming why a done session can't
 * move or that the workout is gone. Toast arguments are static translation
 * keys (R-PIIInterpolation). A move Garmin has not followed gets the drift
 * toast, which offers Update Garmin and pushes nothing on its own.
 */

import { useCallback } from "react";

import {
  moveSession,
  SessionNotMovableError,
  WorkoutNotFoundError,
} from "../../../application/move-session";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { PersistencePort } from "../../../ports/persistence-port";
import { useGarminDriftToast } from "../session-move/use-garmin-drift-toast";

const nowIso = () => new Date().toISOString();

export function useGridMove(persistence: () => PersistencePort) {
  const t = useTranslate("calendar");
  const toast = useToastContext();
  const notifyDrift = useGarminDriftToast(persistence);

  return useCallback(
    (workoutId: string, targetDay: string): void => {
      const deps = { ...persistence(), now: nowIso };
      moveSession(deps, { workoutId, targetDay })
        .then(() => notifyDrift(workoutId).catch(() => false))
        .catch((error: unknown) => {
          if (error instanceof WorkoutNotFoundError)
            toast.error(t("reschedule.notFound"));
          else if (!(error instanceof SessionNotMovableError))
            toast.error(t("reschedule.moveFailed"));
          else if (error.reason === "executed")
            toast.error(t("reschedule.blockedExecuted"));
          else toast.error(t("reschedule.blockedCompleted"));
        });
    },
    [persistence, toast, t, notifyDrift]
  );
}
