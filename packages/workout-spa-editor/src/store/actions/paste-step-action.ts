import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import type { ItemId } from "../providers/item-id";
import { asItemId } from "../providers/item-id";
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
  newItemId?: ItemId;
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
    const newItemId = asItemId((freshPayload as { id: string }).id);

    return { success: true, message, updatedKrd, newItemId };
  } catch {
    return { success: false, message: "Failed to paste from clipboard" };
  }
};
