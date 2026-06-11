import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { createZwiftParsingError } from "@kaiord/core";

import { encodeTextEvents } from "./text-events-encoder";

const encodeDurations = (
  onStep: WorkoutStep,
  offStep: WorkoutStep,
  intervalsT: Record<string, unknown>
): void => {
  if (onStep.duration.type === "time") {
    intervalsT["@_OnDuration"] = onStep.duration.seconds;
  } else if (onStep.duration.type === "distance") {
    intervalsT["@_OnDuration"] = onStep.duration.meters;
  }

  if (offStep.duration.type === "time") {
    intervalsT["@_OffDuration"] = offStep.duration.seconds;
  } else if (offStep.duration.type === "distance") {
    intervalsT["@_OffDuration"] = offStep.duration.meters;
  }
};

const encodePowerTargets = (
  onStep: WorkoutStep,
  offStep: WorkoutStep,
  intervalsT: Record<string, unknown>
): void => {
  if (
    onStep.target.type === "power" &&
    onStep.target.value.unit === "percent_ftp"
  ) {
    intervalsT["@_OnPower"] = onStep.target.value.value / 100;
  }
  if (
    offStep.target.type === "power" &&
    offStep.target.value.unit === "percent_ftp"
  ) {
    intervalsT["@_OffPower"] = offStep.target.value.value / 100;
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
  repetitionBlock: RepetitionBlock
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

  encodeDurations(onStep, offStep, intervalsT);
  encodePowerTargets(onStep, offStep, intervalsT);
  encodeCadenceTargets(onStep, offStep, intervalsT);

  const textEvents = encodeTextEvents(onStep);
  if (textEvents) {
    intervalsT.textevent = textEvents;
  }

  return intervalsT;
};
