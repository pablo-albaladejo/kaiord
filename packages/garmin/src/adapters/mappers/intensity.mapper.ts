import type { Intensity, Logger } from "@kaiord/core";

const STEP_TYPE_TO_INTENSITY: Record<string, Intensity> = {
  warmup: "warmup",
  cooldown: "cooldown",
  interval: "active",
  recovery: "recovery",
  rest: "rest",
  main: "active",
};

export type StepTypeKey =
  | "warmup"
  | "cooldown"
  | "interval"
  | "recovery"
  | "rest";

const INTENSITY_TO_STEP_TYPE: Record<string, StepTypeKey> = {
  warmup: "warmup",
  cooldown: "cooldown",
  active: "interval",
  recovery: "recovery",
  rest: "rest",
  interval: "interval",
  other: "interval",
};

export const mapStepTypeToIntensity = (
  stepTypeKey: string,
  logger?: Logger
): Intensity => {
  const mapped = STEP_TYPE_TO_INTENSITY[stepTypeKey];
  if (mapped) return mapped;
  logger?.warn(
    "Lossy conversion: unknown Garmin step type, defaulting to active",
    { stepTypeKey }
  );
  return "active";
};

export const mapIntensityToStepType = (
  intensity: string,
  logger?: Logger
): StepTypeKey => {
  const mapped = INTENSITY_TO_STEP_TYPE[intensity];
  if (mapped) return mapped;
  logger?.warn(
    "Lossy conversion: unknown intensity, defaulting to interval step type",
    { intensity }
  );
  return "interval";
};
