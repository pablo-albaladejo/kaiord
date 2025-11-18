import {
  intensitySchema,
  type Intensity,
} from "../../../domain/schemas/intensity";
import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { ZwiftDurationData } from "../duration/duration.mapper";
import { mapZwiftDuration } from "../duration/duration.mapper";
import { convertZwiftPowerRange } from "../target/target.converter";
import { extractTextEvents, type ZwiftTextEvent } from "./index";

export type ZwiftRampData = {
  Duration?: number;
  durationType?: "time" | "distance";
  PowerLow?: number;
  PowerHigh?: number;
  Cadence?: number;
  stepIndex: number;
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>;
};

/**
 * Map Zwift Warmup interval to KRD step
 * Warmup intervals ramp from low to high power with "warmup" intensity
 */
export const mapWarmupToKrd = (data: ZwiftRampData): WorkoutStep => {
  return mapRampToKrd(data, intensitySchema.enum.warmup);
};

/**
 * Map Zwift Ramp interval to KRD step
 * Ramp intervals progress between two power values with "active" intensity
 */
export const mapRampToKrd = (
  data: ZwiftRampData,
  intensity: Intensity = intensitySchema.enum.active
): WorkoutStep => {
  const durationData: ZwiftDurationData = {
    Duration: data.Duration,
    durationType: data.durationType,
  };

  const duration = mapZwiftDuration(durationData);

  let target: Target;
  if (data.PowerLow !== undefined && data.PowerHigh !== undefined) {
    target = convertZwiftPowerRange(data.PowerLow, data.PowerHigh);
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
    intensity,
    ...textEventData,
  };
};

/**
 * Map Zwift Cooldown interval to KRD step
 * Cooldown intervals ramp from high to low power with "cooldown" intensity
 */
export const mapCooldownToKrd = (data: ZwiftRampData): WorkoutStep => {
  return mapRampToKrd(data, intensitySchema.enum.cooldown);
};
