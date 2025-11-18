import { intensitySchema } from "../../../domain/schemas/intensity";
import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { ZwiftDurationData } from "../duration/duration.mapper";
import { mapZwiftDuration } from "../duration/duration.mapper";
import { convertZwiftPowerTarget } from "../target/target.converter";
import { extractTextEvents, type ZwiftTextEvent } from "./index";

export type ZwiftSteadyStateData = {
  Duration?: number;
  durationType?: "time" | "distance";
  Power?: number;
  Cadence?: number;
  stepIndex: number;
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>;
};

export const mapSteadyStateToKrd = (
  data: ZwiftSteadyStateData
): WorkoutStep => {
  const durationData: ZwiftDurationData = {
    Duration: data.Duration,
    durationType: data.durationType,
  };

  const duration = mapZwiftDuration(durationData);

  let target: Target;
  if (data.Power !== undefined) {
    target = convertZwiftPowerTarget(data.Power);
  } else {
    target = { type: targetTypeSchema.enum.open };
  }

  const textEventData = extractTextEvents(data.textevent);

  return {
    stepIndex: data.stepIndex,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: intensitySchema.enum.active,
    ...textEventData,
  };
};
