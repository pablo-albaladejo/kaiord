import type {
  Duration,
  Logger,
  Sport,
  Target,
  WorkoutStep,
} from "@kaiord/core";

import { convertTcxDuration } from "../duration/duration-walker.converter";
import { extractExtensions, extractIntensity } from "./step-helpers";
import { convertTargetWithExtensions } from "./target-with-extensions.helper";

type BuildStepInput = {
  stepIndex: number;
  name: string | undefined;
  duration: Duration;
  target: Target;
  tcxStep: Record<string, unknown>;
  extensions: Record<string, unknown> | undefined;
};

const buildWorkoutStep = ({
  stepIndex,
  name,
  duration,
  target,
  tcxStep,
  extensions,
}: BuildStepInput): WorkoutStep => {
  const step: WorkoutStep = {
    stepIndex,
    name,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: extractIntensity(tcxStep),
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

  const duration = convertTcxDuration(
    tcxStep.Duration as Record<string, unknown> | undefined,
    logger
  );
  if (!duration) {
    logger.warn("Step has no valid duration, skipping", { stepIndex });
    return null;
  }

  const extensions = extractExtensions(tcxStep, logger);
  const target = convertTargetWithExtensions(
    tcxStep,
    extensions,
    sport,
    logger
  );
  if (!target) {
    logger.warn("Step has no valid target, skipping", { stepIndex });
    return null;
  }

  return buildWorkoutStep({
    stepIndex,
    name: tcxStep.Name as string | undefined,
    duration,
    target,
    tcxStep,
    extensions,
  });
};
