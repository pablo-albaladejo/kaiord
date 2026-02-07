import type { KRD } from "@kaiord/core";
import { createTcxParsingError } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { extractKaiordMetadata } from "./metadata-extractor";
import { convertTcxWorkout } from "./workout.converter";

const extractTcxExtensions = (
  trainingCenterDatabase: Record<string, unknown>,
  logger: Logger
): Record<string, unknown> | undefined => {
  const extensions = trainingCenterDatabase.Extensions as
    | Record<string, unknown>
    | undefined;
  if (!extensions) {
    return undefined;
  }

  logger.debug("Extracting TCX extensions from TrainingCenterDatabase");

  // Store the raw TCX extensions for round-trip preservation
  return { ...extensions };
};

const extractWorkoutData = (
  trainingCenterDatabase: Record<string, unknown>
): Record<string, unknown> => {
  const workouts = trainingCenterDatabase.Workouts as
    | Record<string, unknown>
    | undefined;

  if (!workouts) {
    throw createTcxParsingError("No workouts found in TCX file");
  }

  const workoutArray = Array.isArray(workouts.Workout)
    ? workouts.Workout
    : [workouts.Workout];

  if (workoutArray.length === 0) {
    throw createTcxParsingError("No workout data found in TCX file");
  }

  return workoutArray[0] as Record<string, unknown>;
};

export const convertTcxToKRD = (
  tcxData: Record<string, unknown>,
  logger: Logger
): KRD => {
  logger.debug("Converting TCX to KRD");

  const trainingCenterDatabase = tcxData.TrainingCenterDatabase as Record<
    string,
    unknown
  >;

  const tcxWorkout = extractWorkoutData(trainingCenterDatabase);
  const workout = convertTcxWorkout(tcxWorkout, logger);
  const tcxExtensions = extractTcxExtensions(trainingCenterDatabase, logger);
  const metadata = extractKaiordMetadata(trainingCenterDatabase, workout);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata,
    extensions: {
      workout,
      ...(tcxExtensions && { tcx: tcxExtensions }),
    },
  };

  logger.debug("TCX to KRD conversion complete");
  return krd;
};
