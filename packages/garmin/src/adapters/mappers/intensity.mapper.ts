import type { Intensity } from "@kaiord/core";

const STEP_TYPE_TO_INTENSITY: Record<string, Intensity> = {
  warmup: "warmup",
  cooldown: "cooldown",
  interval: "active",
  recovery: "recovery",
  rest: "rest",
  main: "active",
};

const INTENSITY_TO_STEP_TYPE: Record<string, string> = {
  warmup: "warmup",
  cooldown: "cooldown",
  active: "interval",
  recovery: "recovery",
  rest: "rest",
  interval: "interval",
  other: "interval",
};

export const mapStepTypeToIntensity = (stepTypeKey: string): Intensity =>
  STEP_TYPE_TO_INTENSITY[stepTypeKey] ?? "active";

export const mapIntensityToStepType = (intensity: string): string =>
  INTENSITY_TO_STEP_TYPE[intensity] ?? "interval";
