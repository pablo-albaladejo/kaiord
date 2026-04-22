import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import {
  createUpdatedKrd,
  getSuccessMessage,
  insertStep,
  readClipboard,
  regeneratePasteIds,
} from "./paste-step-helpers";
import {
  isValidRepetitionBlock,
  isValidWorkoutStep,
} from "./paste-step-validators";

export type PasteStepResult = {
  success: boolean;
  message: string;
  updatedKrd?: KRD;
  /**
   * Stable id of the just-pasted item (step or block). Exposed so the
   * store caller can set `pendingFocusTarget` to `createdItemTarget(id)`
   * after the `updateWorkout` commit. Always a fresh UUID produced by
   * `regeneratePasteIds` — never the clipboard-supplied id (paste-path
   * trust boundary, design decision 1).
   */
  pastedItemId?: string;
};

export const pasteStepAction = async (
  krd: KRD,
  insertIndex?: number
): Promise<PasteStepResult> => {
  if (!krd.extensions?.structured_workout) {
    return { success: false, message: "No workout found" };
  }

  const workout = krd.extensions.structured_workout as Workout;

  try {
    const clipboardResult = await readClipboard();
    if (!clipboardResult.success) {
      return { success: false, message: clipboardResult.message! };
    }

    const parsedData = clipboardResult.data;

    if (
      !isValidWorkoutStep(parsedData) &&
      !isValidRepetitionBlock(parsedData)
    ) {
      return {
        success: false,
        message: "Clipboard does not contain a valid step",
      };
    }

    const freshPayload = regeneratePasteIds(
      parsedData as WorkoutStep | RepetitionBlock
    );

    const updatedWorkout = insertStep(workout, freshPayload, insertIndex);

    const updatedKrd = createUpdatedKrd(krd, updatedWorkout);
    const message = getSuccessMessage(freshPayload);
    const pastedItemId = (freshPayload as { id?: string }).id;

    return { success: true, message, updatedKrd, pastedItemId };
  } catch {
    return { success: false, message: "Failed to paste from clipboard" };
  }
};
