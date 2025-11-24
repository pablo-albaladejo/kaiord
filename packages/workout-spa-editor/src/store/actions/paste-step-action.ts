/**
 * Paste Step Action
 *
 * Action for pasting a workout step from the clipboard.
 * Requirement 39.2: Read step data from clipboard and insert at current position
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import {
  isValidRepetitionBlock,
  isValidWorkoutStep,
} from "./paste-step-validators";
import { recalculateStepIndices } from "./recalculate-step-indices";

export type PasteStepResult = {
  success: boolean;
  message: string;
  updatedKrd?: KRD;
};

export const pasteStepAction = async (
  krd: KRD,
  insertIndex?: number
): Promise<PasteStepResult> => {
  if (!krd.extensions?.workout) {
    return {
      success: false,
      message: "No workout found",
    };
  }

  const workout = krd.extensions.workout as Workout;

  try {
    // Read from clipboard
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText || clipboardText.trim() === "") {
      return {
        success: false,
        message: "No content in clipboard",
      };
    }

    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(clipboardText);
    } catch {
      return {
        success: false,
        message: "Invalid clipboard content",
      };
    }

    // Validate step structure
    if (
      !isValidWorkoutStep(parsedData) &&
      !isValidRepetitionBlock(parsedData)
    ) {
      return {
        success: false,
        message: "Clipboard does not contain a valid step",
      };
    }

    // Determine insert position
    const targetIndex =
      insertIndex !== undefined ? insertIndex : workout.steps.length;

    // Insert the step
    const newSteps = [...workout.steps];
    newSteps.splice(
      targetIndex,
      0,
      parsedData as WorkoutStep | RepetitionBlock
    );

    // Recalculate all step indices
    const updatedSteps = recalculateStepIndices(newSteps);

    // Create updated KRD
    const updatedKrd: KRD = {
      ...krd,
      extensions: {
        ...krd.extensions,
        workout: {
          ...workout,
          steps: updatedSteps,
        },
      },
    };

    // Determine message based on step type
    const message = isRepetitionBlock(parsedData)
      ? "Repetition block pasted successfully"
      : "Step pasted successfully";

    return {
      success: true,
      message,
      updatedKrd,
    };
  } catch {
    return {
      success: false,
      message: "Failed to paste from clipboard",
    };
  }
};
