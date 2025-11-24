import { useCallback, useState } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import {
  useDeleteStep,
  useUndoDelete,
} from "../../../store/workout-store-selectors";

export const useDeleteHandlers = () => {
  const deleteStep = useDeleteStep();
  const undoDelete = useUndoDelete();
  const { toast } = useToastContext();
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);

  const handleDeleteRequest = useCallback((stepIndex: number) => {
    setStepToDelete(stepIndex);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (stepToDelete !== null) {
      deleteStep(stepToDelete);
      setStepToDelete(null);

      // Get the most recent deleted step (the one we just deleted)
      // We need to get it from the store after the delete happens
      const deletedSteps = useWorkoutStore.getState().deletedSteps;
      const mostRecentDelete = deletedSteps[deletedSteps.length - 1];

      if (mostRecentDelete) {
        const timestamp = mostRecentDelete.timestamp;

        // Show undo toast
        toast({
          title: "Step deleted",
          variant: "info",
          duration: 5000,
          action: (
            <button
              onClick={() => undoDelete(timestamp)}
              className="px-3 py-1 text-sm font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              data-testid="undo-delete-button"
            >
              Undo
            </button>
          ),
        });
      }
    }
  }, [stepToDelete, deleteStep, toast, undoDelete]);

  const handleDeleteCancel = useCallback(() => {
    setStepToDelete(null);
  }, []);

  return {
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    stepToDelete,
  };
};
