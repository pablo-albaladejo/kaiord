import { useCallback } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";

/**
 * Hook for pasting a step from clipboard with toast notification
 * Requirement 39.2: Read step data from clipboard and show notification
 */
export function usePasteStep() {
  const pasteStep = useWorkoutStore((state) => state.pasteStep);
  const { success, error } = useToastContext();

  return useCallback(
    async (insertIndex?: number) => {
      const result = await pasteStep(insertIndex);

      if (result.success) {
        success(result.message);
      } else {
        error(result.message);
      }
    },
    [pasteStep, success, error]
  );
}
