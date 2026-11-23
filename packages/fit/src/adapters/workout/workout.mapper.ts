import type { Workout } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { convertLengthToMeters } from "@kaiord/core";

import { fitStringPrefix } from "../krd-to-fit/fit-string";
import { mapLengthUnitToKrd } from "../length-unit/length-unit.mapper";
import { mapSportType } from "../shared/type-guards";
import type { FitWorkoutMessage, FitWorkoutStep } from "../shared/types";
import { mapSubSportToKrd } from "../sub-sport/sub-sport.mapper";
import {
  buildWorkoutSteps,
  findRepetitionStepIndices,
} from "./repetition.builder";

/**
 * The writer also copies workout notes onto a first step that has none, so a
 * watch shows them; that copy is the description again, not a note of its own.
 */
const dropAttachedWorkoutNotes = (
  steps: Workout["steps"],
  notes: string | undefined
): void => {
  const first = steps[0];
  if (!notes || !first || "repeatCount" in first) return;
  if (first.notes === fitStringPrefix(notes)) delete first.notes;
};

export const mapWorkout = (
  workoutMsg: FitWorkoutMessage | undefined,
  workoutSteps: Array<FitWorkoutStep>,
  logger: Logger
): Workout => {
  logger.debug("Mapping workout steps", {
    stepCount: workoutSteps.length,
  });

  const repetitionStepIndices = findRepetitionStepIndices(workoutSteps);
  const steps = buildWorkoutSteps(workoutSteps, repetitionStepIndices, logger);

  const notes = workoutMsg?.wktDescription;
  dropAttachedWorkoutNotes(steps, notes);

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
