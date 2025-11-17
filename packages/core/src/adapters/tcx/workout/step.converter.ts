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
  extensions: Record<string, unknown> | null,
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

  const name = tcxStep.Name as string | undefined;

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

  const step: WorkoutStep = {
    stepIndex,
    name,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: extractIntensity(tcxStep),
  };

  if (extensions) {
    return {
      ...step,
      extensions: {
        tcx: extensions,
      },
    };
  }

  return step;
};
