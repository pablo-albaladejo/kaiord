import type { Logger, WorkoutStep } from "@kaiord/core";

import {
  encodeRampPowerTarget,
  encodeSteadyStatePowerTarget,
} from "./power-encoder";

export const encodeSteadyStateTargets = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  encodeSteadyStatePowerTarget(step, interval, logger);

  if (step.target.type === "pace" && step.target.value.unit === "mps") {
    // Zwift pace is sec/km, KRD is m/s: sec/km = 1000 / m_s.
    interval["@_pace"] = 1000 / step.target.value.value;
  }
};

export const encodeRampTargets = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  encodeRampPowerTarget(step, interval, logger);

  if (step.target.type === "pace" && step.target.value.unit === "range") {
    // Zwift pace is sec/km, KRD is m/s: sec/km = 1000 / m_s. paceLow (slowest)
    // maps to the fastest speed, hence max→Low / min→High.
    interval["@_paceLow"] = 1000 / step.target.value.max;
    interval["@_paceHigh"] = 1000 / step.target.value.min;
  }
};

export const encodeFreeRideTargets = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  const stepExtensions = step.extensions?.zwift as
    Record<string, unknown> | undefined;
  const flatRoad = (stepExtensions?.flatRoad || stepExtensions?.FlatRoad) as
    number | undefined;
  if (flatRoad !== undefined) {
    interval["@_FlatRoad"] = flatRoad;
  }
};

export const encodeTargets = (
  step: WorkoutStep,
  intervalType: string,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (intervalType === "SteadyState") {
    encodeSteadyStateTargets(step, interval, logger);
  } else if (
    intervalType === "Warmup" ||
    intervalType === "Ramp" ||
    intervalType === "Cooldown"
  ) {
    encodeRampTargets(step, interval, logger);
  } else if (intervalType === "FreeRide") {
    encodeFreeRideTargets(step, interval);
  }
};

export const encodeCadence = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  if (step.target.type === "cadence" && step.target.value.unit === "rpm") {
    interval["@_Cadence"] = step.target.value.value;
  }
};
