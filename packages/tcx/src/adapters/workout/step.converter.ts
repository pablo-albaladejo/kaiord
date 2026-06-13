import type {
  Duration,
  Logger,
  Sport,
  Target,
  WorkoutStep,
} from "@kaiord/core";

import { resolveDurationAndTarget } from "./resolve-step-parts";
import { extractExtensions, extractIntensity } from "./step-helpers";

type BuildStepInput = {
  stepIndex: number;
  name: string | undefined;
  duration: Duration;
  target: Target;
  tcxStep: Record<string, unknown>;
  extensions: Record<string, unknown> | undefined;
  logger: Logger;
};

const buildWorkoutStep = ({
  stepIndex,
  name,
  duration,
  target,
  tcxStep,
  extensions,
  logger,
}: BuildStepInput): WorkoutStep => {
  const step: WorkoutStep = {
    stepIndex,
    name,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: extractIntensity(tcxStep, logger),
  };

  return extensions ? { ...step, extensions: { tcx: extensions } } : step;
};

export const convertTcxStep = (
  tcxStep: Record<string, unknown>,
  stepIndex: number,
  sport: Sport,
  logger: Logger
): WorkoutStep | null => {
  logger.debug("Converting TCX step", { stepIndex });

  const stepType = tcxStep["@_xsi:type"] as string | undefined;
  if (stepType === "Repeat_t") {
    logger.warn("Repetition blocks not yet supported", { stepIndex });
    return null;
  }

  const extensions = extractExtensions(tcxStep, logger);
  const resolved = resolveDurationAndTarget({
    tcxStep,
    extensions,
    sport,
    stepIndex,
    logger,
  });
  if (!resolved) {
    return null;
  }

  return buildWorkoutStep({
    stepIndex,
    name: tcxStep.Name as string | undefined,
    duration: resolved.duration,
    target: resolved.target,
    tcxStep,
    extensions,
    logger,
  });
};
