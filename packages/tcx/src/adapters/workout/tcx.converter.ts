import type { KRD } from "@kaiord/core";
import type { Workout, WorkoutStep } from "@kaiord/core";
import { createTcxParsingError } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { KRD_TO_TCX_SPORT } from "../schemas/tcx-sport";
import { addKaiordMetadata } from "./metadata-builder";
import { convertStepToTcx } from "./step-to-tcx.converter";

const buildTcxWorkout = (
  workout: Workout,
  logger: Logger
): Record<string, unknown> => {
  const tcxSport =
    KRD_TO_TCX_SPORT[workout.sport as keyof typeof KRD_TO_TCX_SPORT] || "Other";

  const tcxSteps = workout.steps.map((step, index) =>
    convertStepToTcx(step as WorkoutStep, index, logger)
  );

  const tcxWorkout: Record<string, unknown> = {
    "@_Sport": tcxSport,
    Name: workout.name,
    Step: tcxSteps,
  };

  if (workout.extensions?.tcx) {
    logger.debug("Restoring workout-level TCX extensions");
    tcxWorkout.Extensions = workout.extensions.tcx;
  }

  return tcxWorkout;
};

const buildTrainingCenterDatabase = (
  tcxWorkout: Record<string, unknown>,
  krd: KRD,
  logger: Logger
): Record<string, unknown> => {
  const trainingCenterDatabase: Record<string, unknown> = {
    "@_xmlns": "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2",
    "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "@_xmlns:kaiord": "http://kaiord.dev/tcx-extensions/1.0",
    Workouts: {
      Workout: tcxWorkout,
    },
  };

  addKaiordMetadata(trainingCenterDatabase, krd);

  if (krd.extensions?.tcx) {
    logger.debug("Restoring TrainingCenterDatabase-level TCX extensions");
    trainingCenterDatabase.Extensions = krd.extensions.tcx;
  }

  return trainingCenterDatabase;
};

export const convertKRDToTcx = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting KRD to TCX structure");

  if (!krd.extensions?.workout) {
    throw createTcxParsingError(
      "KRD does not contain workout data in extensions"
    );
  }

  const workout = krd.extensions.workout as Workout;
  const tcxWorkout = buildTcxWorkout(workout, logger);
  const trainingCenterDatabase = buildTrainingCenterDatabase(
    tcxWorkout,
    krd,
    logger
  );

  return {
    TrainingCenterDatabase: trainingCenterDatabase,
  };
};
