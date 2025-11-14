import { convertLengthToMeters } from "../../../domain/converters/length-unit.converter";
import type { Workout } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { mapLengthUnitToKrd } from "../length-unit/length-unit.mapper";
import { mapSportType } from "../shared/type-guards";
import type { FitWorkoutMessage, FitWorkoutStep } from "../shared/types";
import { mapSubSportToKrd } from "../sub-sport/sub-sport.mapper";
import {
  buildWorkoutSteps,
  findRepetitionStepIndices,
} from "./repetition.builder";

export const mapWorkout = (
  workoutMsg: FitWorkoutMessage | undefined,
  workoutSteps: Array<FitWorkoutStep>,
  logger: Logger
): Workout => {
  logger.debug("Mapping workout steps", {
    stepCount: workoutSteps.length,
  });

  const repetitionStepIndices = findRepetitionStepIndices(workoutSteps);
  const steps = buildWorkoutSteps(workoutSteps, repetitionStepIndices);

  const workout: Workout = {
    name: workoutMsg?.wktName,
    sport: mapSportType(workoutMsg?.sport),
    steps,
  };

  if (workoutMsg?.subSport !== undefined) {
    workout.subSport = mapSubSportToKrd(workoutMsg.subSport);
  }

  if (workoutMsg?.poolLength !== undefined) {
    const unit = mapLengthUnitToKrd(workoutMsg.poolLengthUnit);
    workout.poolLength = convertLengthToMeters(workoutMsg.poolLength, unit);
    workout.poolLengthUnit = "meters";
  }

  return workout;
};
