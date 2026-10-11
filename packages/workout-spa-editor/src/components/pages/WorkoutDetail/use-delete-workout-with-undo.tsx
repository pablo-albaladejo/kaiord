import { useCallback } from "react";

import { restoreDeletedWorkout } from "../../../application/restore-deleted-workout";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";

/** How long the Undo of a workout delete stays on screen. */
export const UNDO_WORKOUT_DELETE_MS = 10_000;

const UNDO_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20";

/**
 * Deletes through the tombstoning port, runs `onDeleted` (leave the page),
 * then offers Undo, which writes the row back newer than its tombstone.
 */
export function useDeleteWorkoutWithUndo(onDeleted: () => void) {
  const persistence = usePersistence();
  const { toast } = useToastContext();
  const t = useTranslate("workout-detail");

  return useCallback(
    async (record: WorkoutRecord) => {
      await persistence.workouts.delete(record.id);
      onDeleted();
      toast({
        title: t("delete.done"),
        variant: "info",
        duration: UNDO_WORKOUT_DELETE_MS,
        action: (
          <button
            type="button"
            onClick={() => void restoreDeletedWorkout(persistence, record)}
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
