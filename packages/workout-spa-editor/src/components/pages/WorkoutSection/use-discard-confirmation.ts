import { useCallback } from "react";

import { useClearWorkout } from "../../../store";
import { useShowConfirmationModal } from "../../../store/selectors";

const DISCARD_MODAL_CONFIG = {
  title: "Discard Workout",
  message:
    "Are you sure you want to discard the current workout? This action cannot be undone.",
  confirmLabel: "Discard",
  cancelLabel: "Cancel",
  variant: "destructive" as const,
};

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
  const clearWorkout = useClearWorkout();
  const showConfirmationModal = useShowConfirmationModal();

  return useCallback(() => {
    showConfirmationModal({
      ...DISCARD_MODAL_CONFIG,
      onConfirm: () => {
        clearWorkout();
        onAfterConfirm?.();
      },
    });
  }, [clearWorkout, showConfirmationModal, onAfterConfirm]);
}
