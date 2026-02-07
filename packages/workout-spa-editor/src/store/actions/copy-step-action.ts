/**
 * Copy Step Action
 *
 * Action for copying a workout step to the clipboard.
 * Requirement 39.2: Copy step data as JSON to clipboard
 */

import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";
import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";

export type CopyStepResult = {
  success: boolean;
  message: string;
};

export const copyStepAction = async (
  krd: KRD,
  stepIndex: number
): Promise<CopyStepResult> => {
  if (!krd.extensions?.workout) {
    return {
      success: false,
      message: "No workout found",
    };
  }

  const workout = krd.extensions.workout as Workout;

  // Find the step to copy
  const stepToCopy = workout.steps.find(
    (step: WorkoutStep | RepetitionBlock) => {
      if (isWorkoutStep(step)) {
        return step.stepIndex === stepIndex;
      }
      if (isRepetitionBlock(step)) {
        // Check if any step in the block matches
        return step.steps.some((s) => s.stepIndex === stepIndex);
      }
      return false;
    }
  );

  if (!stepToCopy) {
    return {
      success: false,
      message: "Step not found",
    };
  }

  try {
    // Copy step as JSON to clipboard
    const stepJson = JSON.stringify(stepToCopy, null, 2);
    await navigator.clipboard.writeText(stepJson);

    // Determine message based on step type
    const message = isRepetitionBlock(stepToCopy)
      ? "Repetition block copied to clipboard"
      : "Step copied to clipboard";

    return {
      success: true,
      message,
    };
  } catch {
    return {
      success: false,
      message: "Failed to copy to clipboard",
    };
  }
};
