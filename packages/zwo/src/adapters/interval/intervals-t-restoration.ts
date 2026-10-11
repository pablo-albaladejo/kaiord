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

// Zwift's Cadence attribute doubles as a target when a side has no power, so
// a side whose real target travels in kaiord:* must be rebuilt from those.
const carriesTarget = (
  attributes: Record<string, unknown>,
  step: WorkoutStep
): boolean =>
  step.target.type === "open" ||
  Object.keys(attributes).some(
    (key) => key === "kaiord:powerUnit" || key.startsWith("kaiord:hrTarget")
  );

// A side without power exposes its cadence as the target; once the real target
// is restored, the cadence goes back to the zwift extension it came from.
const restoreSideExtras = (
  restored: WorkoutStep,
  steady: ZwiftSteadyStateData,
  data: ZwiftIntervalsTData,
  side: Side
): void => {
  const cadence = side === "on" ? data.Cadence : data.CadenceResting;
  if (restored.target.type !== "cadence" && cadence !== undefined) {
    const zwift = restored.extensions?.zwift as
      Record<string, unknown> | undefined;
    restored.extensions = {
      ...restored.extensions,
      zwift: { ...zwift, cadence },
    };
  }
  if (steady["kaiord:name"]) restored.name = steady["kaiord:name"];
  if (steady["kaiord:equipment"]) {
    restored.equipment = steady["kaiord:equipment"] as WorkoutStep["equipment"];
  }
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
  const target = carriesTarget(attributes, step)
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
  restoreSideExtras(restored, steady, data, side);
  return restored;
};
