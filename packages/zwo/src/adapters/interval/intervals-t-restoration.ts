// kaiord:on*/kaiord:off* attributes carry the KRD fields of each half of an
// IntervalsT pair (power zones, watts, HR targets, names, intensities,
// non-time durations) that Zwift's OnPower/OffPower cannot express.
import type { Logger, WorkoutStep } from "@kaiord/core";

import { convertOriginalZwiftDuration } from "../duration/original-duration.converter";
import { restoreIntensity } from "./intensity-restoration";
import type { ZwiftIntervalsTData } from "./intervals-t-helpers";
import type { ZwiftSteadyStateData } from "./steady-state.converter";
import { restoreSteadyStateTarget } from "./steady-state-target.helpers";

type Side = "on" | "off";

const sideAttributes = (
  data: ZwiftIntervalsTData,
  side: Side
): Record<string, unknown> => {
  const prefix = `kaiord:${side}`;
  const attributes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(prefix) || key.length === prefix.length) continue;
    const name = key.slice(prefix.length);
    attributes[`kaiord:${name[0]!.toLowerCase()}${name.slice(1)}`] = value;
  }
  return attributes;
};

export const restoreIntervalsTStep = (
  step: WorkoutStep,
  data: ZwiftIntervalsTData,
  side: Side,
  logger?: Logger
): WorkoutStep => {
  const attributes = sideAttributes(data, side);
  if (Object.keys(attributes).length === 0) return step;

  const steady = {
    ...attributes,
    Duration: side === "on" ? data.OnDuration : data.OffDuration,
    Power: side === "on" ? data.OnPower : data.OffPower,
    durationType: data.durationType,
    stepIndex: step.stepIndex,
  } as ZwiftSteadyStateData;

  const duration = convertOriginalZwiftDuration(steady, logger);
  const target =
    steady["kaiord:powerUnit"] !== undefined || step.target.type === "open"
      ? restoreSteadyStateTarget(steady)
      : step.target;
  const restored: WorkoutStep = {
    ...step,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: restoreIntensity(
      steady["kaiord:intensity"],
      logger,
      step.intensity
    ),
  };
  if (steady["kaiord:name"]) restored.name = steady["kaiord:name"];
  if (steady["kaiord:equipment"]) {
    restored.equipment = steady["kaiord:equipment"] as WorkoutStep["equipment"];
  }
  return restored;
};
