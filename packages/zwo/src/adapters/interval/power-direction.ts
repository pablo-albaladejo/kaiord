import type { WorkoutStep } from "@kaiord/core";

// KRD ranges are always min <= max, so a block that ramps down (a Zwift
// cooldown, PowerLow > PowerHigh) keeps its direction here instead.
const DESCENDING = "descending";

type ZwiftStepExtensions = Record<string, unknown> & {
  powerDirection?: string;
};

const zwiftExtensions = (step: WorkoutStep): ZwiftStepExtensions | undefined =>
  step.extensions?.zwift as ZwiftStepExtensions | undefined;

export const markPowerDirection = (
  step: WorkoutStep,
  powerLow: number | undefined,
  powerHigh: number | undefined
): void => {
  if (powerLow === undefined || powerHigh === undefined) return;
  if (powerLow <= powerHigh) return;
  step.extensions = {
    ...step.extensions,
    zwift: { ...zwiftExtensions(step), powerDirection: DESCENDING },
  };
};

export const isPowerDescending = (step: WorkoutStep): boolean =>
  zwiftExtensions(step)?.powerDirection === DESCENDING;
