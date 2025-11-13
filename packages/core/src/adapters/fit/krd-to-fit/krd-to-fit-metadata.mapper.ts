import { fileTypeEnum } from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { fitMessageKeyEnum } from "../schemas/fit-message-keys";
import { DEFAULT_MANUFACTURER, isRepetitionBlock } from "../type-guards";

export const convertMetadataToFileId = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting metadata to file_id message");

  const timeCreated = new Date(krd.metadata.created);

  return {
    type: fitMessageKeyEnum.enum.fileIdMesgs,
    fileIdMesg: {
      type: fileTypeEnum.enum.workout,
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
    type: fitMessageKeyEnum.enum.workoutMesgs,
    workoutMesg: {
      wktName: workout.name,
      sport: workout.sport,
      numValidSteps,
    },
  };
};

const countValidSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): number => {
  let count = 0;
  for (const step of steps) {
    if (isRepetitionBlock(step)) {
      count += step.steps.length + 1;
    } else {
      count += 1;
    }
  }
  return count;
};
