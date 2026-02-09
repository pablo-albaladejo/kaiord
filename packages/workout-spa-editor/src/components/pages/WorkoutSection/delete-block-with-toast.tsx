/**
 * Executes repetition block deletion and shows an undo toast.
 *
 * After deleting, retrieves the most recent deleted step
 * from the store and displays a toast with an undo button.
 */

import { useWorkoutStore } from "../../../store/workout-store";
import type { useToastContext } from "../../../contexts/ToastContext";

export function executeDeleteWithToast(
  blockId: string,
  deleteAction: (blockId: string) => void,
  toast: ReturnType<typeof useToastContext>["toast"],
  undoDelete: (timestamp: number) => void
) {
  deleteAction(blockId);
  setTimeout(() => {
    const { deletedSteps } = useWorkoutStore.getState();
    const mostRecentDelete = deletedSteps[deletedSteps.length - 1];
    if (mostRecentDelete) {
      toast({
        title: "Repetition block deleted",
        variant: "info",
        duration: 5000,
        action: (
          <button
            onClick={() => undoDelete(mostRecentDelete.timestamp)}
            className="px-3 py-1 text-sm font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="undo-delete-block-button"
          >
            Undo
          </button>
        ),
      });
    }
  }, 0);
}
