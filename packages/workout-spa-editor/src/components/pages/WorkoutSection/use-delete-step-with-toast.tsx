/**
 * Hook that wraps step deletion with an undo toast notification.
 *
 * After deleting, retrieves the most recent deleted step
 * from the store and displays a toast with an undo button.
 */

import { useCallback } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import {
  useDeleteStep,
  useUndoDelete,
} from "../../../store/workout-store-selectors";

export function useDeleteStepWithToast() {
  const storeDeleteStep = useDeleteStep();
  const undoDelete = useUndoDelete();
  const { toast } = useToastContext();

  return useCallback(
    (stepIndex: number) => {
      storeDeleteStep(stepIndex);

      setTimeout(() => {
        const { deletedSteps } = useWorkoutStore.getState();
        const mostRecentDelete = deletedSteps[deletedSteps.length - 1];

        if (mostRecentDelete) {
          toast({
            title: "Step deleted",
            description: "The step has been removed from your workout.",
            variant: "info",
            duration: 5000,
            action: (
              <button
                onClick={() => undoDelete(mostRecentDelete.timestamp)}
                data-testid="undo-delete-button"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent px-3 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:pointer-events-none disabled:opacity-50"
              >
                Undo
              </button>
            ),
          });
        }
      }, 0);
    },
    [storeDeleteStep, undoDelete, toast]
  );
}
