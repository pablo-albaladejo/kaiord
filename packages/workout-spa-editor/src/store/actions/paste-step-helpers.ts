/**
 * Helper functions for paste step action
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import { readClipboard as readClipboardText } from "../clipboard-store";
import { defaultIdProvider } from "../providers/id-provider";
import { recalculateStepIndices } from "./recalculate-step-indices";

/**
 * Regenerate every `id` field on a pasted step / block so:
 *  - A clipboard-supplied id cannot redirect focus to an attacker-chosen
 *    DOM node (paste-path trust boundary, design decision 1).
 *  - The pasted item is distinguishable from any existing item with the
 *    same id — focus / selection can reference it independently.
 */
export const regeneratePasteIds = (
  payload: WorkoutStep | RepetitionBlock
): WorkoutStep | RepetitionBlock => {
  if (isRepetitionBlock(payload)) {
    return {
      ...payload,
      id: defaultIdProvider(),
      steps: payload.steps.map((s) => ({ ...s, id: defaultIdProvider() })),
    };
  }
  return { ...payload, id: defaultIdProvider() };
};

/**
 * Read and parse clipboard content
 */
export const readClipboard = async (): Promise<{
  success: boolean;
  data?: unknown;
  message?: string;
}> => {
  const clipboardText = await readClipboardText();

  if (!clipboardText || clipboardText.trim() === "") {
    return { success: false, message: "No content in clipboard" };
  }

  try {
    const data = JSON.parse(clipboardText);
    return { success: true, data };
  } catch {
    return { success: false, message: "Invalid clipboard content" };
  }
};

/**
 * Insert step into workout and recalculate indices
 */
export const insertStep = (
  workout: Workout,
  step: WorkoutStep | RepetitionBlock,
  insertIndex?: number
): Workout => {
  const targetIndex =
    insertIndex !== undefined ? insertIndex : workout.steps.length;

  const newSteps = [...workout.steps];
  newSteps.splice(targetIndex, 0, step);

  const updatedSteps = recalculateStepIndices(newSteps);

  return {
    ...workout,
    steps: updatedSteps,
  };
};

/**
 * Create updated KRD with new workout
 */
export const createUpdatedKrd = (krd: KRD, workout: Workout): KRD => ({
  ...krd,
  extensions: {
    ...krd.extensions,
    structured_workout: workout,
  },
});

/**
 * Get success message based on step type
 */
export const getSuccessMessage = (
  step: WorkoutStep | RepetitionBlock
): string =>
  isRepetitionBlock(step)
    ? "Repetition block pasted successfully"
    : "Step pasted successfully";
