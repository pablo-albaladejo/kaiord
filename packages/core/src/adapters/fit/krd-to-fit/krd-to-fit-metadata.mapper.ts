import type { KRD } from "../../../domain/schemas/krd";
import type { Workout } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import {
  DEFAULT_MANUFACTURER,
  FIT_FILE_TYPE,
  FIT_MESSAGE_KEY,
  TYPE_GUARD_PROPERTY,
} from "../constants";

export const convertMetadataToFileId = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting metadata to file_id message");

  const timeCreated = new Date(krd.metadata.created);

  return {
    type: FIT_MESSAGE_KEY.FILE_ID,
    fileIdMesg: {
      type: FIT_FILE_TYPE.WORKOUT,
      manufacturer: krd.metadata.manufacturer || DEFAULT_MANUFACTURER,
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
    if (TYPE_GUARD_PROPERTY.REPEAT_COUNT in step) {
      count += step.steps.length + 1;
    } else {
      count += 1;
    }
  }
  return count;
};
