import type { WorkoutStep } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { createFitParsingError } from "@kaiord/core";

import { mapEquipmentToFit } from "../equipment/equipment.mapper";
import {
  FIT_STRING_MAX_BYTES,
  fitStringBytes,
  fitStringPrefix,
} from "../shared/fit-string";
import { convertDuration } from "./krd-to-fit-duration.converter";
import { convertTarget } from "./krd-to-fit-target.converter";

export type TruncationBehavior = "truncate" | "error";

export type ConvertWorkoutStepOptions = {
  /** How to handle notes over the 254 bytes of a FIT string. Default: "truncate" */
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

export const convertNotes = (
  notes: string,
  stepIndex: number,
  behavior: TruncationBehavior,
  logger: Logger
): string => {
  const bytes = fitStringBytes(notes);
  if (bytes <= FIT_STRING_MAX_BYTES) {
    return notes;
  }

  if (behavior === "error") {
    throw createFitParsingError(
      `Notes exceed the ${FIT_STRING_MAX_BYTES} bytes of a FIT string at step ${stepIndex} ` +
        `(${bytes} bytes). Use notesTruncation: "truncate" to auto-truncate.`
    );
  }

  logger.warn(
    `Notes truncated from ${bytes} to ${FIT_STRING_MAX_BYTES} bytes, the most a FIT string holds`,
    { stepIndex, originalBytes: bytes }
  );
  return fitStringPrefix(notes);
};
