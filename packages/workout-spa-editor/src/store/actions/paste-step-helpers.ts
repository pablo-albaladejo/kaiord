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
import { recalculateStepIndices } from "./recalculate-step-indices";

/**
 * Read and parse clipboard content
 */
export const readClipboard = async (): Promise<{
  success: boolean;
  data?: unknown;
  message?: string;
}> => {
  const clipboardText = await navigator.clipboard.readText();

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
    workout,
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
