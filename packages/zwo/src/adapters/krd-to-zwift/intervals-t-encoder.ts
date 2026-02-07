import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
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

const encodeCadenceTargets = (
  onStep: WorkoutStep,
  offStep: WorkoutStep,
  intervalsT: Record<string, unknown>
): void => {
  if (onStep.target.type === "cadence" && onStep.target.value.unit === "rpm") {
    intervalsT["@_Cadence"] = onStep.target.value.value;
  } else {
    const onStepExtensions = onStep.extensions?.zwift as
      | Record<string, unknown>
      | undefined;
    const cadence = onStepExtensions?.cadence as number | undefined;
    if (cadence !== undefined) {
      intervalsT["@_Cadence"] = cadence;
    }
  }

  if (
    offStep.target.type === "cadence" &&
    offStep.target.value.unit === "rpm"
  ) {
    intervalsT["@_CadenceResting"] = offStep.target.value.value;
  } else {
    const offStepExtensions = offStep.extensions?.zwift as
      | Record<string, unknown>
      | undefined;
    const cadenceResting = offStepExtensions?.cadence as number | undefined;
    if (cadenceResting !== undefined) {
      intervalsT["@_CadenceResting"] = cadenceResting;
    }
  }
};

export const encodeIntervalsT = (
  repetitionBlock: RepetitionBlock
): Record<string, unknown> => {
  const onStep = repetitionBlock.steps[0];
  const offStep = repetitionBlock.steps[1];

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
