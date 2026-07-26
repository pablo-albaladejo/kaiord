import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { useWorkoutStore } from "../../../store/workout-store";

/**
 * Hook for pasting a step from clipboard with toast notification
 * Requirement 39.2: Read step data from clipboard and show notification
 */
export function usePasteStep() {
  const t = useTranslate("editor");
  const pasteStep = useWorkoutStore((state) => state.pasteStep);
  const { success, error } = useToastContext();

  return useCallback(
    async (insertIndex?: number) => {
      const result = await pasteStep(insertIndex);

      if (result.success) {
        success(t("clipboard.pasteSuccess"));
      } else {
        // The failure copy (editor.clipboard.pasteFailure = "Clipboard does
        // not contain a valid step") matches the e2e regex spanning the
        // empty-clipboard, no-valid-step, and invalid-content branches.
        error(t("clipboard.pasteFailure"));
      }
    },
    [pasteStep, success, error, t]
  );
}
