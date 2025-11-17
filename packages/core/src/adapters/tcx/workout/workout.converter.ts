import type { Workout, WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { TCX_TO_KRD_SPORT, tcxSportSchema } from "../schemas/tcx-sport";
import { convertTcxStep } from "./step.converter";

const extractWorkoutExtensions = (
  tcxWorkout: Record<string, unknown>,
  logger: Logger
): Record<string, unknown> | undefined => {
  const extensions = tcxWorkout.Extensions as
    | Record<string, unknown>
    | undefined;
  if (!extensions) {
    return undefined;
  }

  logger.debug("Extracting TCX extensions from workout");

  // Store the raw TCX extensions for round-trip preservation
  return { ...extensions };
};

const convertSteps = (
  tcxSteps: unknown,
  logger: Logger
): Array<WorkoutStep> => {
  const steps: Array<WorkoutStep> = [];

  if (!tcxSteps) return steps;

  const stepArray = Array.isArray(tcxSteps) ? tcxSteps : [tcxSteps];
  let stepIndex = 0;

  for (const tcxStep of stepArray) {
    const step = convertTcxStep(
      tcxStep as Record<string, unknown>,
      stepIndex,
      logger
    );
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

  const sportAttr = tcxWorkout["@_Sport"] as string | undefined;
  const sportResult = tcxSportSchema.safeParse(sportAttr);
  const sport = sportResult.success
    ? TCX_TO_KRD_SPORT[sportResult.data]
    : "generic";

  const name = tcxWorkout.Name as string | undefined;
  const steps = convertSteps(tcxWorkout.Step, logger);
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
