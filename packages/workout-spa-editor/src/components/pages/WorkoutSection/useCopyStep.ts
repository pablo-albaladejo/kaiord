import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { useWorkoutStore } from "../../../store/workout-store";

/**
 * Hook for copying a step to clipboard with toast notification
 * Requirement 39.2: Copy step data as JSON to clipboard and show notification
 */
export function useCopyStep() {
  const t = useTranslate("editor");
  const copyStep = useWorkoutStore((state) => state.copyStep);
  const { success, error } = useToastContext();

  return useCallback(
    async (stepIndex: number) => {
      const result = await copyStep(stepIndex);

      if (result.success) {
        success(t("clipboard.copySuccess"));
      } else {
        error(t("clipboard.copyFailure"));
      }
    },
    [copyStep, success, error, t]
  );
}
