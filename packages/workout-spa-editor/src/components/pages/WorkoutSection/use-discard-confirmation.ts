import { useCallback } from "react";
import { useClearWorkout } from "../../../store";
import { useShowConfirmationModal } from "../../../store/workout-store-selectors";

const DISCARD_MODAL_CONFIG = {
  title: "Discard Workout",
  message:
    "Are you sure you want to discard the current workout? This action cannot be undone.",
  confirmLabel: "Discard",
  cancelLabel: "Cancel",
  variant: "destructive" as const,
};

export function useDiscardConfirmation() {
  const clearWorkout = useClearWorkout();
  const showConfirmationModal = useShowConfirmationModal();

  return useCallback(() => {
    showConfirmationModal({
      ...DISCARD_MODAL_CONFIG,
      onConfirm: () => {
        clearWorkout();
      },
    });
  }, [clearWorkout, showConfirmationModal]);
}
