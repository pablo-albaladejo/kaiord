import type { WorkoutStep } from "@kaiord/core";
import { intensitySchema } from "@kaiord/core";

// KRD ranges are always min <= max, so a block that ramps down (a Zwift
// cooldown, PowerLow > PowerHigh) keeps its direction here instead.
// A cooldown without the flag (built in the editor, read from FIT) ramps
// down, so only a ZWO cooldown that ramps up is flagged "ascending".
const DESCENDING = "descending";
const ASCENDING = "ascending";

type ZwiftStepExtensions = Record<string, unknown> & {
  powerDirection?: string;
};

const zwiftExtensions = (step: WorkoutStep): ZwiftStepExtensions | undefined =>
  step.extensions?.zwift as ZwiftStepExtensions | undefined;

const isCooldown = (step: WorkoutStep): boolean =>
  step.intensity === intensitySchema.enum.cooldown;

const directionOf = (
  step: WorkoutStep,
  powerLow: number,
  powerHigh: number
): string | undefined => {
  if (powerLow > powerHigh) return DESCENDING;
  if (powerLow < powerHigh && isCooldown(step)) return ASCENDING;
  return undefined;
};

export const markPowerDirection = (
  step: WorkoutStep,
  powerLow: number | undefined,
  powerHigh: number | undefined
): void => {
  if (powerLow === undefined || powerHigh === undefined) return;
  const powerDirection = directionOf(step, powerLow, powerHigh);
  if (!powerDirection) return;
  step.extensions = {
    ...step.extensions,
    zwift: { ...zwiftExtensions(step), powerDirection },
  };
};

export const isPowerDescending = (step: WorkoutStep): boolean => {
  const direction = zwiftExtensions(step)?.powerDirection;
  if (direction !== undefined) return direction === DESCENDING;
  return isCooldown(step);
};
