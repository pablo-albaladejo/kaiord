import type { Workout } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { convertLengthToMeters } from "@kaiord/core";

import { mapLengthUnitToKrd } from "../length-unit/length-unit.mapper";
import { mapSportType } from "../shared/type-guards";
import type { FitWorkoutMessage, FitWorkoutStep } from "../shared/types";
import { mapSubSportToKrd } from "../sub-sport/sub-sport.mapper";
import { dropAttachedWorkoutNotes } from "./attached-notes.converter";
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
  const notes = workoutMsg?.wktDescription;
  const steps = dropAttachedWorkoutNotes(
    buildWorkoutSteps(workoutSteps, repetitionStepIndices, logger),
    notes
  );

  const workout: Workout = {
    name: workoutMsg?.wktName,
    ...(notes ? { notes } : {}),
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
