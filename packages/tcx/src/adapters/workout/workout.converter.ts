import type {
  Logger,
  RepetitionBlock,
  Sport,
  Workout,
  WorkoutStep,
} from "@kaiord/core";

import { TCX_TO_KRD_SPORT, tcxSportSchema } from "../schemas/tcx-sport";
import { convertTcxRepeat, isTcxRepeat } from "./repeat-block.converter";
import { convertTcxStep } from "./step.converter";

const extractSport = (tcxWorkout: Record<string, unknown>): Sport => {
  const sportAttr = tcxWorkout["@_Sport"] as string | undefined;
  const sportResult = tcxSportSchema.safeParse(sportAttr);
  return sportResult.success ? TCX_TO_KRD_SPORT[sportResult.data] : "generic";
};

const extractWorkoutExtensions = (
  tcxWorkout: Record<string, unknown>,
  logger: Logger
): Record<string, unknown> | undefined => {
  const extensions = tcxWorkout.Extensions as
    Record<string, unknown> | undefined;
  if (!extensions) {
    return undefined;
  }

  logger.debug("Extracting TCX extensions from workout");

  // Store the raw TCX extensions for round-trip preservation
  return { ...extensions };
};

const convertSteps = (
  tcxSteps: unknown,
  sport: Sport,
  logger: Logger
): Array<WorkoutStep | RepetitionBlock> => {
  const steps: Array<WorkoutStep | RepetitionBlock> = [];

  if (!tcxSteps) return steps;

  const stepArray = (Array.isArray(tcxSteps) ? tcxSteps : [tcxSteps]) as Array<
    Record<string, unknown>
  >;
  let stepIndex = 0;

  for (const tcxStep of stepArray) {
    if (isTcxRepeat(tcxStep)) {
      const block = convertTcxRepeat(tcxStep, stepIndex, sport, logger);
      if (block) {
        steps.push(block);
        stepIndex += block.steps.length;
      }
      continue;
    }
    const step = convertTcxStep(tcxStep, stepIndex, sport, logger);
    if (step) {
      steps.push(step);
      stepIndex++;
    }
  }

  return steps;
};

export const convertTcxWorkout = (
  tcxWorkout: Record<string, unknown>,
  logger: Logger
): Workout => {
  logger.debug("Converting TCX workout");

  const sport = extractSport(tcxWorkout);
  const name = tcxWorkout.Name as string | undefined;
  const steps = convertSteps(tcxWorkout.Step, sport, logger);
  const extensions = extractWorkoutExtensions(tcxWorkout, logger);

  const workout: Workout = {
    name,
    sport,
    steps,
  };

  if (extensions) {
    return {
      ...workout,
      extensions: {
        tcx: extensions,
      },
    };
  }

  return workout;
};
