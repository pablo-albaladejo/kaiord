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
import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";

export type PasteStepResult = {
  success: boolean;
  message: string;
  updatedKrd?: KRD;
};

/**
 * Validate if the parsed data is a valid WorkoutStep
 */
const isValidWorkoutStep = (data: unknown): data is WorkoutStep => {
  if (!data || typeof data !== "object") return false;
  const step = data as Partial<WorkoutStep>;
  return (
    typeof step.stepIndex === "number" &&
    typeof step.durationType === "string" &&
    typeof step.duration === "object" &&
    typeof step.targetType === "string" &&
    typeof step.target === "object"
  );
};

/**
 * Validate if the parsed data is a valid RepetitionBlock
 */
const isValidRepetitionBlock = (data: unknown): data is RepetitionBlock => {
  if (!data || typeof data !== "object") return false;
  const block = data as Partial<RepetitionBlock>;
  return (
    typeof block.repeatCount === "number" &&
    Array.isArray(block.steps) &&
    block.steps.every(isValidWorkoutStep)
  );
};

/**
 * Recalculate step indices for all steps in the workout
 */
const recalculateStepIndices = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  let currentIndex = 0;

  return steps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    if (isRepetitionBlock(step)) {
      const updatedSteps = step.steps.map((s) => ({
        ...s,
        stepIndex: currentIndex++,
      }));
      return { ...step, steps: updatedSteps };
    }
    return step;
  });
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
  } catch (error) {
    return {
      success: false,
      message: "Failed to paste from clipboard",
    };
  }
};
