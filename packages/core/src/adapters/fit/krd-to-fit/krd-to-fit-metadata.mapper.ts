import { fileTypeSchema } from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { DEFAULT_MANUFACTURER, isRepetitionBlock } from "../shared/type-guards";
import { mapSubSportToFit } from "../sub-sport/sub-sport.mapper";

export const convertMetadataToFileId = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting metadata to file_id message");

  const timeCreated = new Date(krd.metadata.created);

  return {
    type: fitMessageKeySchema.enum.fileIdMesgs,
    fileIdMesg: {
      type: fileTypeSchema.enum.workout,
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

  const workoutMesg: Record<string, unknown> = {
    wktName: workout.name,
    sport: workout.sport,
    numValidSteps,
  };

  if (workout.subSport !== undefined) {
    workoutMesg.subSport = mapSubSportToFit(workout.subSport);
  }

  if (workout.poolLength !== undefined) {
    workoutMesg.poolLength = workout.poolLength;
    workoutMesg.poolLengthUnit = 0;
  }

  return {
    type: fitMessageKeySchema.enum.workoutMesgs,
    workoutMesg,
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
