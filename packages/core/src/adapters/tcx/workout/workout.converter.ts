import type { Workout, WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { TCX_TO_KRD_SPORT, tcxSportSchema } from "../schemas/tcx-sport";
import { convertTcxStep } from "./step.converter";

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

  const steps: Array<WorkoutStep> = [];
  const tcxSteps = tcxWorkout.Step;

  if (tcxSteps) {
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
  }

  return {
    name,
    sport,
    steps,
  };
};
