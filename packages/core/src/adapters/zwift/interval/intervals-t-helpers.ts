import { intensitySchema } from "../../../domain/schemas/intensity";
import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { ZwiftDurationData } from "../duration/duration.mapper";
import { mapZwiftDuration } from "../duration/duration.mapper";
import {
  convertZwiftCadenceTarget,
  convertZwiftPowerTarget,
} from "../target/target.converter";
import { extractTextEvents, type ZwiftTextEvent } from "./index";

export type ZwiftIntervalsTData = {
  Repeat: number;
  OnDuration?: number;
  OnPower?: number;
  OffDuration?: number;
  OffPower?: number;
  Cadence?: number;
  CadenceResting?: number;
  durationType?: "time" | "distance";
  stepIndex: number;
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>;
};

export const createOnStep = (data: ZwiftIntervalsTData): WorkoutStep => {
  const onDurationData: ZwiftDurationData = {
    Duration: data.OnDuration,
    durationType: data.durationType,
  };
  const onDuration = mapZwiftDuration(onDurationData);

  let onTarget: Target;
  if (data.OnPower !== undefined) {
    onTarget = convertZwiftPowerTarget(data.OnPower);
  } else if (data.Cadence !== undefined) {
    onTarget = convertZwiftCadenceTarget(data.Cadence);
  } else {
    onTarget = { type: targetTypeSchema.enum.open };
  }

  const textEventData = extractTextEvents(data.textevent);

  const onStep: WorkoutStep = {
    stepIndex: data.stepIndex,
    durationType: onDuration.type,
    duration: onDuration,
    targetType: onTarget.type,
    target: onTarget,
    intensity: intensitySchema.enum.active,
    ...textEventData,
  };

  if (data.OnPower !== undefined && data.Cadence !== undefined) {
    onStep.extensions = {
      zwift: {
        cadence: data.Cadence,
      },
    };
  }

  return onStep;
};

export const createOffStep = (data: ZwiftIntervalsTData): WorkoutStep => {
  const offDurationData: ZwiftDurationData = {
    Duration: data.OffDuration,
    durationType: data.durationType,
  };
  const offDuration = mapZwiftDuration(offDurationData);

  let offTarget: Target;
  if (data.OffPower !== undefined) {
    offTarget = convertZwiftPowerTarget(data.OffPower);
  } else if (data.CadenceResting !== undefined) {
    offTarget = convertZwiftCadenceTarget(data.CadenceResting);
  } else {
    offTarget = { type: targetTypeSchema.enum.open };
  }

  const offStep: WorkoutStep = {
    stepIndex: data.stepIndex + 1,
    durationType: offDuration.type,
    duration: offDuration,
    targetType: offTarget.type,
    target: offTarget,
    intensity: intensitySchema.enum.recovery,
  };

  if (data.OffPower !== undefined && data.CadenceResting !== undefined) {
    offStep.extensions = {
      zwift: {
        cadence: data.CadenceResting,
      },
    };
  }

  return offStep;
};
