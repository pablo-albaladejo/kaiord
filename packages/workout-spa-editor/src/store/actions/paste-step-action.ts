import {
  createUpdatedKrd,
  getSuccessMessage,
  insertStep,
  readClipboard,
} from "./paste-step-helpers";
import {
  isValidRepetitionBlock,
  isValidWorkoutStep,
} from "./paste-step-validators";
import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";

export type PasteStepResult = {
  success: boolean;
  message: string;
  updatedKrd?: KRD;
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

    const updatedWorkout = insertStep(
      workout,
      parsedData as WorkoutStep | RepetitionBlock,
      insertIndex
    );

    const updatedKrd = createUpdatedKrd(krd, updatedWorkout);
    const message = getSuccessMessage(
      parsedData as WorkoutStep | RepetitionBlock
    );

    return { success: true, message, updatedKrd };
  } catch {
    return { success: false, message: "Failed to paste from clipboard" };
  }
};
