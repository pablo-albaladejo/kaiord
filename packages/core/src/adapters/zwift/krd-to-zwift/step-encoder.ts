import type { WorkoutStep } from "../../../domain/schemas/workout";
import { encodeTextEvents } from "./text-events-encoder";

const encodeDuration = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  if (step.duration.type === "time") {
    interval["@_Duration"] = step.duration.seconds;
  } else if (step.duration.type === "distance") {
    interval["@_Duration"] = step.duration.meters;
  }
};

const encodeSteadyStateTargets = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  if (
    step.target.type === "power" &&
    step.target.value.unit === "percent_ftp"
  ) {
    interval["@_Power"] = step.target.value.value / 100;
  } else if (step.target.type === "pace" && step.target.value.unit === "mps") {
    interval["@_pace"] = 1000 / step.target.value.value;
  }
};

const encodeRampTargets = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  if (step.target.type === "power" && step.target.value.unit === "range") {
    interval["@_PowerLow"] = step.target.value.min / 100;
    interval["@_PowerHigh"] = step.target.value.max / 100;
  } else if (
    step.target.type === "pace" &&
    step.target.value.unit === "range"
  ) {
    interval["@_paceLow"] = 1000 / step.target.value.max;
    interval["@_paceHigh"] = 1000 / step.target.value.min;
  }
};

const encodeFreeRideTargets = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  const stepExtensions = step.extensions?.zwift as
    | Record<string, unknown>
    | undefined;
  const flatRoad = (stepExtensions?.flatRoad || stepExtensions?.FlatRoad) as
    | number
    | undefined;
  if (flatRoad !== undefined) {
    interval["@_FlatRoad"] = flatRoad;
  }
};

const encodeTargets = (
  step: WorkoutStep,
  intervalType: string,
  interval: Record<string, unknown>
): void => {
  if (intervalType === "SteadyState") {
    encodeSteadyStateTargets(step, interval);
  } else if (
    intervalType === "Warmup" ||
    intervalType === "Ramp" ||
    intervalType === "Cooldown"
  ) {
    encodeRampTargets(step, interval);
  } else if (intervalType === "FreeRide") {
    encodeFreeRideTargets(step, interval);
  }
};

const encodeCadence = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  if (step.target.type === "cadence" && step.target.value.unit === "rpm") {
    interval["@_Cadence"] = step.target.value.value;
  }
};

export const convertStepToInterval = (
  step: WorkoutStep,
  intervalType: string
): Record<string, unknown> => {
  const interval: Record<string, unknown> = {};

  encodeDuration(step, interval);
  encodeTargets(step, intervalType, interval);
  encodeCadence(step, interval);

  const textEvents = encodeTextEvents(step);
  if (textEvents) {
    interval.textevent = textEvents;
  }

  return interval;
};
