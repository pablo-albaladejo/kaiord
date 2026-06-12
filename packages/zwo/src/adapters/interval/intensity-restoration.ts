import { type Intensity, intensitySchema, type Logger } from "@kaiord/core";

// Zwift has no intensity notion; KRD intensity survives only via the
// @_kaiord:intensity round-trip attribute. A stored value outside the KRD
// intensity vocabulary is corrupt round-trip data, so narrow it loudly to the
// neutral default rather than silently coercing.
export const restoreIntensity = (
  rawIntensity: string | undefined,
  logger?: Logger,
  defaultIntensity: Intensity = intensitySchema.enum.active
): Intensity => {
  if (rawIntensity === undefined) return defaultIntensity;

  const parsed = intensitySchema.safeParse(rawIntensity);
  if (parsed.success) return parsed.data;

  logger?.warn(
    "Lossy conversion: intensity has no Zwift equivalent, using default",
    { originalIntensity: rawIntensity, substitution: defaultIntensity }
  );
  return defaultIntensity;
};
