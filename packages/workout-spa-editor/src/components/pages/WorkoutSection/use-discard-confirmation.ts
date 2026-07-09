import { useCallback } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { useClearWorkout } from "../../../store";
import { useShowConfirmationModal } from "../../../store/selectors";

/**
 * Returns the open-the-discard-modal handler.
 *
 * `onAfterConfirm` is invoked after `clearWorkout()` only when the
 * user confirms the modal. Callers passing a closure MUST wrap it in
 * `useCallback` to preserve handler identity across re-renders — this
 * hook lists `onAfterConfirm` in its dependency array so unstable
 * callbacks would create a new memoized handler on every parent render.
 */
export function useDiscardConfirmation(onAfterConfirm?: () => void) {
  const t = useTranslate("editor");
  const clearWorkout = useClearWorkout();
  const showConfirmationModal = useShowConfirmationModal();
  const title = t("discard.title");
  const message = t("discard.message");
  const confirmLabel = t("discard.confirmLabel");
  const cancelLabel = t("discard.cancelLabel");

  return useCallback(() => {
    showConfirmationModal({
      title,
      message,
      confirmLabel,
      cancelLabel,
      variant: "destructive",
      onConfirm: () => {
        clearWorkout();
        onAfterConfirm?.();
      },
    });
  }, [
    clearWorkout,
    showConfirmationModal,
    onAfterConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
  ]);
}
