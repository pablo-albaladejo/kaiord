import { useCallback } from "react";

import {
  deleteWorkoutAndMatch,
  restoreWorkoutAndMatch,
} from "../../../application/coaching/delete-coaching-workout";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";

/** How long the Undo of a workout delete stays on screen. */
export const UNDO_WORKOUT_DELETE_MS = 10_000;

const UNDO_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20";

/**
 * Deletes the workout and its Match through the tombstoning port, runs
 * `onDeleted` (leave the page), then offers Undo, which writes both back
 * newer than their tombstones. Shared by the detail page and the coaching
 * dialog, so a delete from either never leaves a Match pointing at nothing.
 */
export function useDeleteWorkoutWithUndo(onDeleted: () => void) {
  const persistence = usePersistence();
  const { toast } = useToastContext();
  const t = useTranslate("workout-detail");

  return useCallback(
    async (record: WorkoutRecord) => {
      const deleted = await deleteWorkoutAndMatch(persistence, record.id);
      onDeleted();
      if (!deleted) return;
      toast({
        title: t("delete.done"),
        variant: "info",
        duration: UNDO_WORKOUT_DELETE_MS,
        action: (
          <button
            type="button"
            onClick={() => void restoreWorkoutAndMatch(persistence, deleted)}
            data-testid="undo-delete-workout"
            className={UNDO_CLASS}
          >
            {t("delete.undo")}
          </button>
        ),
      });
    },
    [persistence, onDeleted, toast, t]
  );
}
