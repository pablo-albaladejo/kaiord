import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";

const PASTE_SUCCESS_TOAST = "Step pasted successfully";
const PASTE_FAILURE_TOAST = "Failed to paste step";

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
        success(PASTE_SUCCESS_TOAST);
      } else {
        error(PASTE_FAILURE_TOAST);
      }
    },
    [pasteStep, success, error]
  );
}
