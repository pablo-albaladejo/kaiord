import type { Logger, RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { createZwiftParsingError } from "@kaiord/core";

import { encodeDuration } from "./duration-encoder";
import { encodeHeartRateTarget, encodeMetadata } from "./metadata-encoder";
import { encodeSteadyStatePowerTarget } from "./power-encoder";
import { encodeTextEvents } from "./text-events-encoder";

type Side = "on" | "off";

const KAIORD_PREFIX = "@_kaiord:";

// kaiord:* attributes carry KRD concepts Zwift's schema cannot express so a
// Zwift round-trip is lossless even though native readers ignore them. Each
// half of the pair is encoded like a SteadyState, then its attributes are
// namespaced per side (kaiord:powerZone → kaiord:onPowerZone) because
// IntervalsT holds both steps on one element.
const encodeSide = (
  step: WorkoutStep,
  side: Side,
  intervalsT: Record<string, unknown>,
  logger?: Logger
): void => {
  const encoded: Record<string, unknown> = {};
  encodeDuration(step, encoded, logger);
  encodeSteadyStatePowerTarget(step, encoded, logger);
  encodeHeartRateTarget(step, encoded, logger);
  encodeMetadata(step, encoded);

  const label = side === "on" ? "On" : "Off";
  intervalsT[`@_${label}Duration`] = encoded["@_Duration"];
  if (encoded["@_Power"] !== undefined) {
    intervalsT[`@_${label}Power`] = encoded["@_Power"];
  }
  for (const [key, value] of Object.entries(encoded)) {
    if (!key.startsWith(KAIORD_PREFIX)) continue;
    const name = key.slice(KAIORD_PREFIX.length);
    const sideName = `${side}${name[0]!.toUpperCase()}${name.slice(1)}`;
    intervalsT[`${KAIORD_PREFIX}${sideName}`] = value;
  }
};

const resolveStepCadence = (step: WorkoutStep): number | undefined => {
  if (step.target.type === "cadence") {
    const cadenceValue = step.target.value;
    if (cadenceValue.unit === "rpm") return cadenceValue.value as number;
    if (
      cadenceValue.unit === "range" &&
      cadenceValue.min !== undefined &&
      cadenceValue.max !== undefined
    ) {
      return Math.round((cadenceValue.min + cadenceValue.max) / 2);
    }
  }
  const zwift = step.extensions ? step.extensions.zwift : undefined;
  const extensions = zwift as Record<string, unknown> | undefined;
  return extensions ? (extensions.cadence as number | undefined) : undefined;
};

const encodeCadenceTargets = (
  onStep: WorkoutStep,
  offStep: WorkoutStep,
  intervalsT: Record<string, unknown>
): void => {
  const cadence = resolveStepCadence(onStep);
  if (cadence !== undefined) {
    intervalsT["@_Cadence"] = cadence;
  }
  const cadenceResting = resolveStepCadence(offStep);
  if (cadenceResting !== undefined) {
    intervalsT["@_CadenceResting"] = cadenceResting;
  }
};

export const encodeIntervalsT = (
  repetitionBlock: RepetitionBlock,
  logger?: Logger
): Record<string, unknown> => {
  const [onStep, offStep] = repetitionBlock.steps;
  if (!onStep || !offStep) {
    throw createZwiftParsingError(
      "IntervalsT requires a two-step repetition block (on/off)"
    );
  }

  const intervalsT: Record<string, unknown> = {
    "@_Repeat": repetitionBlock.repeatCount,
  };

  encodeSide(onStep, "on", intervalsT, logger);
  encodeSide(offStep, "off", intervalsT, logger);
  encodeCadenceTargets(onStep, offStep, intervalsT);

  const textEvents = encodeTextEvents(onStep);
  if (textEvents) {
    intervalsT.textevent = textEvents;
  }

  return intervalsT;
};
