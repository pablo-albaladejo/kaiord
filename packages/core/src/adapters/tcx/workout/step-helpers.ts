import type { Logger } from "../../../ports/logger";

export const extractIntensity = (
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

export const extractPowerFromExtensions = (
  extensions: Record<string, unknown>,
  logger: Logger
): number | undefined => {
  if (extensions.TPX) {
    const tpx = extensions.TPX as Record<string, unknown>;
    if (typeof tpx.Watts === "number") {
      logger.debug("Found power data in TCX extensions", {
        watts: tpx.Watts,
      });
      return tpx.Watts;
    }
  }

  if (extensions.Power && typeof extensions.Power === "number") {
    logger.debug("Found power data in TCX extensions", {
      watts: extensions.Power,
    });
    return extensions.Power;
  }

  return undefined;
};

export const extractExtensions = (
  tcxStep: Record<string, unknown>,
  logger: Logger
): Record<string, unknown> | undefined => {
  const extensions = tcxStep.Extensions as Record<string, unknown> | undefined;
  if (!extensions) {
    return undefined;
  }

  logger.debug("Extracting TCX extensions from step");
  return { ...extensions };
};
