import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { convertTcxDuration } from "../duration/duration.mapper";
import { convertTcxTarget } from "../target/target.mapper";

const extractIntensity = (
  tcxStep: Record<string, unknown>
): "warmup" | "active" | "cooldown" | "rest" | undefined => {
  const intensityValue = tcxStep.Intensity as string | undefined;
  return intensityValue?.toLowerCase() as
    | "warmup"
    | "active"
    | "cooldown"
    | "rest"
    | undefined;
};

const extractPowerFromExtensions = (
  extensions: Record<string, unknown>,
  logger: Logger
): number | undefined => {
  // Extract power data if present (common TCX extension)
  // Power data is often in extensions like:
  // <Extensions><TPX xmlns="..."><Watts>250</Watts></TPX></Extensions>
  if (extensions.TPX) {
    const tpx = extensions.TPX as Record<string, unknown>;
    if (typeof tpx.Watts === "number") {
      logger.debug("Found power data in TCX extensions", {
        watts: tpx.Watts,
      });
      return tpx.Watts;
    }
  }

  // Check for other common power extension formats
  if (extensions.Power && typeof extensions.Power === "number") {
    logger.debug("Found power data in TCX extensions", {
      watts: extensions.Power,
    });
    return extensions.Power;
  }

  return undefined;
};

const extractExtensions = (
  tcxStep: Record<string, unknown>,
  logger: Logger
): Record<string, unknown> | undefined => {
  const extensions = tcxStep.Extensions as Record<string, unknown> | undefined;
  if (!extensions) {
    return undefined;
  }

  logger.debug("Extracting TCX extensions from step");

  // Store the raw TCX extensions for round-trip preservation
  return { ...extensions };
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

  let target = convertTcxTarget(
    tcxStep.Target as Record<string, unknown> | undefined,
    logger
  );
  if (!target) {
    logger.warn("Step has no valid target, skipping", { stepIndex });
    return null;
  }

  const extensions = extractExtensions(tcxStep, logger);

  // If target is "open" but we have power data in extensions, convert to power target
  if (target.type === "open" && extensions) {
    const powerWatts = extractPowerFromExtensions(extensions, logger);
    if (powerWatts !== undefined) {
      logger.debug("Converting open target to power target from extensions", {
        watts: powerWatts,
      });
      target = {
        type: "power",
        value: {
          unit: "watts",
          value: powerWatts,
        },
      };
    }
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

  // Add extensions to step if present
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
