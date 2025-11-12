import type { KRD } from "../../domain/schemas/krd";
import type { Workout } from "../../domain/schemas/workout";
import type { Logger } from "../../ports/logger";
import { FIT_MESSAGE_KEY } from "./constants";

export const convertMetadataToFileId = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting metadata to file_id message");

  const timeCreated = new Date(krd.metadata.created);

  return {
    type: FIT_MESSAGE_KEY.FILE_ID,
    fileIdMesg: {
      type: "workout",
      manufacturer: krd.metadata.manufacturer || "development",
      product: krd.metadata.product,
      serialNumber: krd.metadata.serialNumber
        ? parseInt(krd.metadata.serialNumber, 10)
        : undefined,
      timeCreated,
    },
  };
};

export const convertWorkoutMetadata = (
  workout: Workout,
  logger: Logger
): unknown => {
  logger.debug("Converting workout metadata");

  const numValidSteps = countValidSteps(workout.steps);

  return {
    type: FIT_MESSAGE_KEY.WORKOUT,
    workoutMesg: {
      wktName: workout.name,
      sport: workout.sport,
      numValidSteps,
    },
  };
};

const countValidSteps = (
  steps: Array<
    | { stepIndex: number }
    | { repeatCount: number; steps: Array<{ stepIndex: number }> }
  >
): number => {
  let count = 0;
  for (const step of steps) {
    if ("repeatCount" in step) {
      count += step.steps.length + 1;
    } else {
      count += 1;
    }
  }
  return count;
};
