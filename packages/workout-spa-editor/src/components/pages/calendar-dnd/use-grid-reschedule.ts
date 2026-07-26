/**
 * useGridReschedule — wires `usePointerDrag` to the
 * `rescheduleWorkout` use case backed by Dexie. The hook owns the
 * persistence call so the calendar grid only needs to read the
 * resulting `bind` / `dropTargetId` API.
 *
 * Failures are non-fatal: the optimistic UI reverts via the underlying
 * `useLiveQuery` re-fetch, and a static error toast surfaces a single
 * line of feedback. The toast first argument is a static translation
 * key (`t("reschedule.moveFailed")`) so the `R-PIIInterpolation`
 * mechanical guard stays green.
 */

import { useCallback } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexieWorkoutRepository } from "../../../adapters/dexie/dexie-workout-repository";
import { rescheduleWorkout } from "../../../application/reschedule-workout";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { usePointerDrag } from "./use-pointer-drag";

export function useGridReschedule() {
  const t = useTranslate("calendar");
  const toast = useToastContext();

  const onDrop = useCallback(
    (workoutId: string, targetDayISO: string): void => {
      const repo = createDexieWorkoutRepository(db);
      rescheduleWorkout(repo, workoutId, targetDayISO).catch(() => {
        toast.error(t("reschedule.moveFailed"));
      });
    },
    [toast, t]
  );

  return usePointerDrag({ onDrop });
}
