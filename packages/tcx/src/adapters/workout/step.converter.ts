import { extractExtensions, extractIntensity } from "./step-helpers";
import { convertTargetWithExtensions } from "./target-with-extensions.helper";
import { convertTcxDuration } from "../duration/duration.mapper";
import type { Duration, Logger, Target, WorkoutStep } from "@kaiord/core";

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
  const target = convertTargetWithExtensions(tcxStep, extensions, logger);
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
