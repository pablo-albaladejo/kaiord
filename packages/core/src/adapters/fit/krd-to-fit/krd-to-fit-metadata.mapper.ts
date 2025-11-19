import { Profile } from "@garmin/fitsdk";
import { fileTypeSchema } from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { isRepetitionBlock } from "../shared/type-guards";
import { mapSubSportToFit } from "../sub-sport/sub-sport.mapper";

export const convertMetadataToFileId = (
  krd: KRD,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Converting metadata to file_id message");

  const timeCreated = new Date(krd.metadata.created);

  const fileId: Record<string, unknown> = {
    type: fileTypeSchema.enum.workout,
    timeCreated,
  };

  // Map manufacturer to valid FIT enum values from Profile
  // The encoder will convert string enum values to numbers automatically
  const manufacturerEnum = Profile.types.manufacturer;
  const manufacturerValues = Object.values(manufacturerEnum);

  // Find matching manufacturer: exact match (case-insensitive) or starts with
  const manufacturer = krd.metadata.manufacturer?.toLowerCase() || "";
  const matchedManufacturer = manufacturerValues.find(
    (value) =>
      value.toLowerCase() === manufacturer ||
      value.toLowerCase().startsWith(manufacturer) ||
      manufacturer.startsWith(value.toLowerCase())
  );

  fileId.manufacturer = matchedManufacturer || "garmin"; // Default to garmin if not found

  // Add product if it's a number or can be parsed as one
  if (krd.metadata.product !== undefined) {
    const productNumber = parseInt(krd.metadata.product, 10);
    if (!isNaN(productNumber)) {
      fileId.product = productNumber;
    }
  }

  if (krd.metadata.serialNumber) {
    fileId.serialNumber = parseInt(krd.metadata.serialNumber, 10);
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
