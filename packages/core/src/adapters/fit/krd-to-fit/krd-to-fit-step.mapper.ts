import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { mapEquipmentToFit } from "../equipment.mapper";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertDuration } from "./krd-to-fit-duration.mapper";
import { convertTarget } from "./krd-to-fit-target.mapper";

export const convertWorkoutStep = (
  step: WorkoutStep,
  messageIndex: number,
  logger: Logger
): unknown => {
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
    if (step.notes.length > 256) {
      logger.warn("Notes exceed 256 characters, truncating", {
        originalLength: step.notes.length,
      });
      workoutStepMesg.notes = step.notes.substring(0, 256);
    } else {
      workoutStepMesg.notes = step.notes;
    }
  }

  if (step.equipment !== undefined) {
    workoutStepMesg.equipment = mapEquipmentToFit(step.equipment);
  }

  convertDuration(step, workoutStepMesg);
  convertTarget(step, workoutStepMesg);

  return {
    type: fitMessageKeySchema.enum.workoutStepMesgs,
    workoutStepMesg,
  };
};
