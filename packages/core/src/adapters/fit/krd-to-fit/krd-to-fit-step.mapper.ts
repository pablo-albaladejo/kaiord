import { createFitParsingError } from "../../../domain/types/errors";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { mapEquipmentToFit } from "../equipment/equipment.mapper";
import { convertDuration } from "./krd-to-fit-duration.mapper";
import { convertTarget } from "./krd-to-fit-target.mapper";

/** FIT protocol maximum length for notes field */
const FIT_NOTES_MAX_LENGTH = 256;

export type TruncationBehavior = "truncate" | "error";

export type ConvertWorkoutStepOptions = {
  /** How to handle notes exceeding 256 characters. Default: "truncate" */
  notesTruncation?: TruncationBehavior;
};

/**
 * Converts a KRD workout step to a FIT workout step message.
 */
export const convertWorkoutStep = (
  step: WorkoutStep,
  messageIndex: number,
  logger: Logger,
  options: ConvertWorkoutStepOptions = {}
): Record<string, unknown> => {
  const { notesTruncation = "truncate" } = options;

  logger.debug("Converting workout step", { stepIndex: step.stepIndex });

  const workoutStepMesg: Record<string, unknown> = {
    messageIndex,
  };

  if (step.name) {
    workoutStepMesg.wktStepName = step.name;
  }

  if (step.intensity) {
    workoutStepMesg.intensity = step.intensity;
  }

  if (step.notes !== undefined) {
    workoutStepMesg.notes = convertNotes(
      step.notes,
      step.stepIndex,
      notesTruncation,
      logger
    );
  }

  if (step.equipment !== undefined) {
    workoutStepMesg.equipment = mapEquipmentToFit(step.equipment);
  }

  convertDuration(step, workoutStepMesg);
  convertTarget(step, workoutStepMesg);

  return workoutStepMesg;
};

const convertNotes = (
  notes: string,
  stepIndex: number,
  behavior: TruncationBehavior,
  logger: Logger
): string => {
  if (notes.length <= FIT_NOTES_MAX_LENGTH) {
    return notes;
  }

  if (behavior === "error") {
    throw createFitParsingError(
      `Notes exceed ${FIT_NOTES_MAX_LENGTH} characters at step ${stepIndex} ` +
        `(length: ${notes.length}). Use notesTruncation: "truncate" to auto-truncate.`
    );
  }

  logger.warn(
    `Notes truncated from ${notes.length} to ${FIT_NOTES_MAX_LENGTH} characters`,
    { stepIndex, originalLength: notes.length }
  );
  return notes.substring(0, FIT_NOTES_MAX_LENGTH);
};
