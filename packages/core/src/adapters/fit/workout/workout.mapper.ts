import type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { DEFAULT_SPORT, FIT_DURATION_TYPE } from "../constants";
import { mapStep } from "./step.mapper";
import type { FitWorkoutMessage, FitWorkoutStep } from "../types";

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

  return {
    name: workoutMsg?.wktName,
    sport: mapSportType(workoutMsg?.sport),
    steps,
  };
};

const findRepetitionStepIndices = (
  workoutSteps: Array<FitWorkoutStep>
): Set<number> => {
  const indices = new Set<number>();

  for (let i = 0; i < workoutSteps.length; i++) {
    const step = workoutSteps[i];
    if (step.durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_STEPS_COMPLETE) {
      const startIndex = (step.durationStep || 0) as number;
      for (let j = startIndex; j < i; j++) {
        indices.add(j);
      }
    }
  }

  return indices;
};

const buildWorkoutSteps = (
  workoutSteps: Array<FitWorkoutStep>,
  repetitionStepIndices: Set<number>
): Array<WorkoutStep | RepetitionBlock> => {
  const steps: Array<WorkoutStep | RepetitionBlock> = [];

  for (let i = 0; i < workoutSteps.length; i++) {
    const step = workoutSteps[i];

    if (
      step.durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_STEPS_COMPLETE &&
      step.repeatSteps
    ) {
      const repetitionBlock = buildRepetitionBlock(step, workoutSteps, i);
      steps.push(repetitionBlock);
    } else if (!repetitionStepIndices.has(i)) {
      steps.push(mapStep(step, i));
    }
  }

  return steps;
};

const buildRepetitionBlock = (
  step: FitWorkoutStep,
  workoutSteps: Array<FitWorkoutStep>,
  currentIndex: number
): RepetitionBlock => {
  const repeatCount = step.repeatSteps!;
  const startIndex = (step.durationStep || 0) as number;
  const repeatedSteps: Array<WorkoutStep> = [];

  for (let j = startIndex; j < currentIndex; j++) {
    repeatedSteps.push(mapStep(workoutSteps[j], j));
  }

  return {
    repeatCount,
    steps: repeatedSteps,
  };
};

const mapSportType = (fitSport: string | undefined): string => {
  if (!fitSport) {
    return DEFAULT_SPORT;
  }
  return fitSport.toLowerCase();
};
