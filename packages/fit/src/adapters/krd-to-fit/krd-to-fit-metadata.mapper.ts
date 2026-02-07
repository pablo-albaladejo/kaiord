import { Profile } from "@garmin/fitsdk";
import type { KRD } from "@kaiord/core";
import type { RepetitionBlock, Workout, WorkoutStep } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { FIT_FILE_TYPE_TO_NUMBER } from "../schemas/fit-file-type";
import { isRepetitionBlock } from "../shared/type-guards";
import { mapSubSportToFit } from "../sub-sport/sub-sport.mapper";

const DEFAULT_MANUFACTURER = "garmin";

/**
 * Maps KRD manufacturer string to valid FIT Profile manufacturer enum value.
 * Uses fuzzy matching (case-insensitive, prefix matching).
 */
const mapManufacturer = (
  manufacturer: string | undefined,
  logger: Logger
): string => {
  if (!manufacturer) {
    return DEFAULT_MANUFACTURER;
  }

  const manufacturerEnum = Profile.types.manufacturer;
  const manufacturerValues = Object.values(manufacturerEnum);
  const normalized = manufacturer.toLowerCase();

  const matched = manufacturerValues.find(
    (value) =>
      value.toLowerCase() === normalized ||
      value.toLowerCase().startsWith(normalized) ||
      normalized.startsWith(value.toLowerCase())
  );

  if (matched) return matched;

  logger.warn(
    `Unknown manufacturer "${manufacturer}", using fallback "${DEFAULT_MANUFACTURER}"`,
    { original: manufacturer, fallback: DEFAULT_MANUFACTURER }
  );
  return DEFAULT_MANUFACTURER;
};

export const convertMetadataToFileId = (
  krd: KRD,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Converting metadata to file_id message");

  const fileType = krd.metadata.fileType ?? "workout";

  const fileId: Record<string, unknown> = {
    type: FIT_FILE_TYPE_TO_NUMBER[fileType] ?? FIT_FILE_TYPE_TO_NUMBER.workout,
    timeCreated: new Date(krd.metadata.created),
    manufacturer: mapManufacturer(krd.metadata.manufacturer, logger),
  };

  if (krd.metadata.product !== undefined) {
    const productNumber = parseInt(krd.metadata.product, 10);
    if (!isNaN(productNumber)) {
      fileId.product = productNumber;
    }
  }

  if (krd.metadata.serialNumber) {
    const serialNumber = parseInt(krd.metadata.serialNumber, 10);
    if (!isNaN(serialNumber)) {
      fileId.serialNumber = serialNumber;
    }
  }

  return fileId;
};

export const convertWorkoutMetadata = (
  workout: Workout,
  logger: Logger
): Record<string, unknown> => {
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

  return workoutMesg;
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
