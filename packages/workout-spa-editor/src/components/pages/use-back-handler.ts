import { useCallback } from "react";
import { useLocation } from "wouter";

import type { BackOrigin } from "../../routing/back-origin";
import { buildPickerHref } from "../../routing/picker-href";
import { resolveBackTarget } from "../../routing/resolve-back-target";
import { extractStructuredWorkout } from "../../store/actions/_helpers/extract-workout";
import { useClearWorkout } from "../../store/selectors/workout-selectors";
import { useWorkoutStore } from "../../store/workout-store";
import type { NewWorkoutMode } from "./render-new-workout-surface";
import { useDiscardConfirmation } from "./WorkoutSection/use-discard-confirmation";

/**
 * Builds the `onBack` callback for the editor's `EditorPageHeader`.
 * Returns `null` when no back affordance should render.
 *
 * Two distinct paths share this hook:
 *  - an explicit `?from=<origin>` resolves a back target via the pure
 *    resolver and yields a plain `navigate` (no draft to discard);
 *  - the legacy in-picker fallback (`scratch`/`import` with no origin)
 *    stays discard-aware so an unsaved draft prompts confirmation.
 *
 * Edit-mode (`?id`) with an origin now yields a back button (#19);
 * edit-mode with no origin still yields `null`.
 */
export function useBackHandler(
  newWorkoutMode: NewWorkoutMode | undefined,
  dateParam: string | null,
  origin: BackOrigin | null,
  weekParam: string | null = null
): (() => void) | null {
  const [, navigate] = useLocation();
  const clearWorkout = useClearWorkout();
  const stepsLength = useWorkoutStore(
    (s) => extractStructuredWorkout(s.currentWorkout)?.steps?.length ?? 0
  );

  const isInPicker =
    newWorkoutMode === "scratch" || newWorkoutMode === "import";
  const backTarget = origin
    ? resolveBackTarget({ origin, date: dateParam, week: weekParam })
    : isInPicker
      ? buildPickerHref(dateParam)
      : null;
  const isDiscardAware = isInPicker && !origin;

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

  const plainBack = useCallback(() => {
    if (backTarget) navigate(backTarget);
  }, [backTarget, navigate]);

  if (!backTarget) return null;
  return isDiscardAware ? handleBack : plainBack;
}
