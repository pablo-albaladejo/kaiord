import { intensitySchema, type Intensity } from "@kaiord/core";
import type { WorkoutStep } from "@kaiord/core";
import { mapZwiftDuration } from "../duration/duration.mapper";
import { extractTextEvents, type ZwiftTextEvent } from "./index";
import {
  addRampMetadata,
  buildRampDurationData,
  resolveIntensity,
  resolveRampTarget,
  type ZwiftRampData,
} from "./ramp-helpers";

export type { ZwiftRampData };

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
  const duration = mapZwiftDuration(buildRampDurationData(data));
  const target = resolveRampTarget(data);
  const textEventData = extractTextEvents(
    data.textevent as ZwiftTextEvent | Array<ZwiftTextEvent> | undefined
  );

  const step: WorkoutStep = {
    stepIndex: data.stepIndex,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: resolveIntensity(data, intensity),
    ...textEventData,
  };

  addRampMetadata(step, data);
  return step;
};

/**
 * Map Zwift Cooldown interval to KRD step
 * Cooldown intervals ramp from high to low power with "cooldown" intensity
 */
export const mapCooldownToKrd = (data: ZwiftRampData): WorkoutStep => {
  return mapRampToKrd(data, intensitySchema.enum.cooldown);
};
