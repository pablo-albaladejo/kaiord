import type { Duration } from "../../../domain/schemas/duration";
import type { Target } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { convertTcxDuration } from "../duration/duration.mapper";
import { convertTcxTarget } from "../target/target.mapper";
import {
  extractExtensions,
  extractIntensity,
  extractPowerFromExtensions,
} from "./step-helpers";

const convertTargetWithExtensions = (
  tcxStep: Record<string, unknown>,
  extensions: Record<string, unknown> | undefined,
  logger: Logger
): Target | null => {
  const target = convertTcxTarget(
    tcxStep.Target as Record<string, unknown> | undefined,
    logger
  );
  if (!target) return null;

  if (target.type === "open" && extensions) {
    const powerWatts = extractPowerFromExtensions(extensions, logger);
    if (powerWatts !== undefined) {
      logger.debug("Converting open target to power target from extensions", {
        watts: powerWatts,
      });
      return {
        type: "power",
        value: {
          unit: "watts",
          value: powerWatts,
        },
      };
    }
  }

  return target;
};

const buildWorkoutStep = (
  stepIndex: number,
  name: string | undefined,
  duration: Duration,
  target: Target,
  tcxStep: Record<string, unknown>,
  extensions: Record<string, unknown> | undefined
): WorkoutStep => {
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

  return buildWorkoutStep(
    stepIndex,
    tcxStep.Name as string | undefined,
    duration,
    target,
    tcxStep,
    extensions
  );
};
