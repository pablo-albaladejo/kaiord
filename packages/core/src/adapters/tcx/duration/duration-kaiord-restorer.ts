import type { Duration } from "../../../domain/schemas/duration";
import type { Logger } from "../../../ports/logger";

const restoreHeartRateLessThan = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const bpm = tcxDuration["@_kaiord:originalDurationBpm"] as number | undefined;
  if (typeof bpm === "number") {
    logger.debug("Restoring heart_rate_less_than from kaiord attributes", {
      bpm,
    });
    return { type: "heart_rate_less_than", bpm };
  }
  return null;
};

const restorePowerLessThan = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const watts = tcxDuration["@_kaiord:originalDurationWatts"] as
    | number
    | undefined;
  if (typeof watts === "number") {
    logger.debug("Restoring power_less_than from kaiord attributes", {
      watts,
    });
    return { type: "power_less_than", watts };
  }
  return null;
};

const restorePowerGreaterThan = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const watts = tcxDuration["@_kaiord:originalDurationWatts"] as
    | number
    | undefined;
  if (typeof watts === "number") {
    logger.debug("Restoring power_greater_than from kaiord attributes", {
      watts,
    });
    return { type: "power_greater_than", watts };
  }
  return null;
};

const restoreCalories = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const calories = tcxDuration["@_kaiord:originalDurationCalories"] as
    | number
    | undefined;
  if (typeof calories === "number") {
    logger.debug("Restoring calories from kaiord attributes", {
      calories,
    });
    return { type: "calories", calories };
  }
  return null;
};

export const restoreKaiordDuration = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const originalDurationType = tcxDuration["@_kaiord:originalDurationType"] as
    | string
    | undefined;

  if (originalDurationType === "heart_rate_less_than") {
    return restoreHeartRateLessThan(tcxDuration, logger);
  }

  if (originalDurationType === "power_less_than") {
    return restorePowerLessThan(tcxDuration, logger);
  }

  if (originalDurationType === "power_greater_than") {
    return restorePowerGreaterThan(tcxDuration, logger);
  }

  if (originalDurationType === "calories") {
    return restoreCalories(tcxDuration, logger);
  }

  return null;
};
