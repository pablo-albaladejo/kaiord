/**
 * The calendar drag's drop: `moveSession` over the given persistence.
 * Failures are non-fatal: the optimistic UI reverts through the
 * `useLiveQuery` re-fetch, and a static toast gives one line of feedback,
 * naming why a done session can't move. Toast arguments are static
 * translation keys (R-PIIInterpolation).
 */

import { useCallback } from "react";

import {
  moveSession,
  SessionNotMovableError,
} from "../../../application/move-session";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { PersistencePort } from "../../../ports/persistence-port";

const nowIso = () => new Date().toISOString();

export function useGridMove(persistence: () => PersistencePort) {
  const t = useTranslate("calendar");
  const toast = useToastContext();

  return useCallback(
    (workoutId: string, targetDay: string): void => {
      const deps = { ...persistence(), now: nowIso };
      moveSession(deps, { workoutId, targetDay }).catch((error: unknown) => {
        if (!(error instanceof SessionNotMovableError))
          toast.error(t("reschedule.moveFailed"));
        else if (error.reason === "executed")
          toast.error(t("reschedule.blockedExecuted"));
        else toast.error(t("reschedule.blockedCompleted"));
      });
    },
    [persistence, toast, t]
  );
}
