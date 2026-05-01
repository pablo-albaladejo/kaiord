import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";

const PASTE_SUCCESS_TOAST = "Step pasted successfully";
// Most paste failures mean the clipboard is empty or holds something
// that isn't a recognised step payload. The text matches the e2e
// regex spanning empty-clipboard, no-valid-step, and invalid-content
// branches without requiring multiple constants.
const PASTE_FAILURE_TOAST = "Clipboard does not contain a valid step";

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
