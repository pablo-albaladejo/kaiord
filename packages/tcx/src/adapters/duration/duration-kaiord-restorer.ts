// Restores KRD duration concepts that TCX's schema cannot natively express
// (heart-rate / power / calorie end-conditions) from `kaiord:` extension
// attributes the encoder wrote onto a LapButton_t, so a TCX round-trip is
// lossless even though native TCX readers ignore those attributes.
import type { Duration } from "@kaiord/core";
import type { Logger } from "@kaiord/core";

/**
 * Reads a restored numeric `kaiord:` attribute. Returns the value only when it
 * is a positive, finite number — a bpm / watts / calorie threshold of 0,
 * negative, NaN, or Infinity is physiologically meaningless, so a present but
 * invalid attribute degrades loudly (warn + null) rather than restoring a
 * corrupt duration. A non-number (attribute absent for this concept) returns
 * null silently.
 */
const readRestoredThreshold = (
  value: unknown,
  conceptLabel: string,
  logger: Logger
): number | null => {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value) || value <= 0) {
    logger.warn(
      `Lossy conversion: kaiord ${conceptLabel} attribute is not a positive finite number, dropping`,
      { value }
    );
    return null;
  }
  return value;
};

const restoreHeartRateLessThan = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const bpm = readRestoredThreshold(
    tcxDuration["@_kaiord:originalDurationBpm"],
    "heart_rate_less_than bpm",
    logger
  );
  if (bpm === null) return null;
  logger.debug("Restoring heart_rate_less_than from kaiord attributes", {
    bpm,
  });
  return { type: "heart_rate_less_than", bpm };
};

const restorePowerLessThan = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const watts = readRestoredThreshold(
    tcxDuration["@_kaiord:originalDurationWatts"],
    "power_less_than watts",
    logger
  );
  if (watts === null) return null;
  logger.debug("Restoring power_less_than from kaiord attributes", { watts });
  return { type: "power_less_than", watts };
};

const restorePowerGreaterThan = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const watts = readRestoredThreshold(
    tcxDuration["@_kaiord:originalDurationWatts"],
    "power_greater_than watts",
    logger
  );
  if (watts === null) return null;
  logger.debug("Restoring power_greater_than from kaiord attributes", {
    watts,
  });
  return { type: "power_greater_than", watts };
};

const restoreCalories = (
  tcxDuration: Record<string, unknown>,
  logger: Logger
): Duration | null => {
  const calories = readRestoredThreshold(
    tcxDuration["@_kaiord:originalDurationCalories"],
    "calories",
    logger
  );
  if (calories === null) return null;
  logger.debug("Restoring calories from kaiord attributes", { calories });
  return { type: "calories", calories };
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
