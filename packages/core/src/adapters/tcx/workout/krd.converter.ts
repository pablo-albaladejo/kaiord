import type { KRD } from "../../../domain/schemas/krd";
import { createTcxParsingError } from "../../../domain/types/errors";
import type { Logger } from "../../../ports/logger";
import { convertTcxWorkout } from "./workout.converter";

export const convertTcxToKRD = (
  tcxData: Record<string, unknown>,
  logger: Logger
): KRD => {
  logger.debug("Converting TCX to KRD");

  const trainingCenterDatabase = tcxData.TrainingCenterDatabase as Record<
    string,
    unknown
  >;
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

  const tcxWorkout = workoutArray[0] as Record<string, unknown>;
  const workout = convertTcxWorkout(tcxWorkout, logger);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport: workout.sport,
      subSport: workout.subSport,
    },
    extensions: {
      workout,
    },
  };

  logger.debug("TCX to KRD conversion complete");
  return krd;
};
