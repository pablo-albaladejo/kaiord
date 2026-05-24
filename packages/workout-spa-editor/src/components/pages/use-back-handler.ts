import { useCallback } from "react";
import { useLocation } from "wouter";

import { buildPickerHref } from "../../routing/picker-href";
import { useClearWorkout } from "../../store/selectors/workout-selectors";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import type { NewWorkoutMode } from "./render-new-workout-surface";
import { useDiscardConfirmation } from "./WorkoutSection/use-discard-confirmation";

/**
 * Builds the `onBack` callback for the create-workout flow's
 * `EditorPageHeader`. Returns `null` when no back affordance should
 * render (e.g., the user is editing a saved workout via `?id`).
 *
 * Accepts `newWorkoutMode` + `dateParam` directly so the back-target
 * derivation lives inside the hook — `EditorPage` stays thin.
 */
export function useBackHandler(
  newWorkoutMode: NewWorkoutMode | undefined,
  dateParam: string | null
): (() => void) | null {
  const [, navigate] = useLocation();
  const clearWorkout = useClearWorkout();
  const stepsLength = useWorkoutStore(
    (s) =>
      (s.currentWorkout?.extensions?.structured_workout as
        | Workout
        | undefined)?.steps?.length ?? 0
  );

  const isInPicker =
    newWorkoutMode === "scratch" || newWorkoutMode === "import";
  const backTarget = isInPicker ? buildPickerHref(dateParam) : null;

  const onAfterConfirm = useCallback(() => {
    if (backTarget) navigate(backTarget);
  }, [backTarget, navigate]);
  const openDiscardModal = useDiscardConfirmation(onAfterConfirm);

  const handleBack = useCallback(() => {
    if (!backTarget) return;
    if (stepsLength > 0) {
      openDiscardModal();
      return;
    }
    clearWorkout();
    navigate(backTarget);
  }, [backTarget, stepsLength, openDiscardModal, clearWorkout, navigate]);

  return backTarget ? handleBack : null;
}
