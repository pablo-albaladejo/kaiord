import type { KRD } from "../../../domain/schemas/krd";
import type { Workout, WorkoutStep } from "../../../domain/schemas/workout";
import { createTcxParsingError } from "../../../domain/types/errors";
import type { Logger } from "../../../ports/logger";
import { KRD_TO_TCX_SPORT } from "../schemas/tcx-sport";
import { convertStepToTcx } from "./step-to-tcx.converter";

export const convertKRDToTcx = (krd: KRD, logger: Logger): unknown => {
  logger.debug("Converting KRD to TCX structure");

  if (!krd.extensions?.workout) {
    throw createTcxParsingError(
      "KRD does not contain workout data in extensions"
    );
  }

  const workout = krd.extensions.workout as Workout;

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

  const trainingCenterDatabase: Record<string, unknown> = {
    "@_xmlns": "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2",
    "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    Workouts: {
      Workout: tcxWorkout,
    },
  };

  if (krd.extensions?.tcx) {
    logger.debug("Restoring TrainingCenterDatabase-level TCX extensions");
    trainingCenterDatabase.Extensions = krd.extensions.tcx;
  }

  return {
    TrainingCenterDatabase: trainingCenterDatabase,
  };
};
