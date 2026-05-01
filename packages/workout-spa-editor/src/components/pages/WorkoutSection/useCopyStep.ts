import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";

const COPY_SUCCESS_TOAST = "Step copied to clipboard";
const COPY_FAILURE_TOAST = "Failed to copy step";

/**
 * Hook for copying a step to clipboard with toast notification
 * Requirement 39.2: Copy step data as JSON to clipboard and show notification
 */
export function useCopyStep() {
  const copyStep = useWorkoutStore((state) => state.copyStep);
  const { success, error } = useToastContext();

  return useCallback(
    async (stepIndex: number) => {
      const result = await copyStep(stepIndex);

      if (result.success) {
        success(COPY_SUCCESS_TOAST);
      } else {
        error(COPY_FAILURE_TOAST);
      }
    },
    [copyStep, success, error]
  );
}
