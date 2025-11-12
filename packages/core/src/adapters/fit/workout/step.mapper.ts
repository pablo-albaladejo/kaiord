import {
  intensityEnum,
  type Intensity,
} from "../../../domain/schemas/intensity";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { mapDuration, mapDurationType } from "../duration/duration.mapper";
import { mapTarget, mapTargetType } from "../target/target.mapper";
import type { FitWorkoutStep } from "../types";

export const mapStep = (step: FitWorkoutStep, index: number): WorkoutStep => {
  const duration = mapDuration(step);
  const target = mapTarget(step);

  return {
    stepIndex: step.messageIndex ?? index,
    name: step.wktStepName,
    durationType: mapDurationType(step.durationType),
    duration,
    targetType: mapTargetType(step.targetType),
    target,
    intensity: mapIntensity(step.intensity),
  };
};

const mapIntensity = (intensity: string | undefined): Intensity | undefined => {
  if (!intensity) return undefined;

  const normalized = intensity.toLowerCase();
  const validIntensities = intensityEnum.options;

  if (validIntensities.includes(normalized as Intensity)) {
    return normalized as Intensity;
  }

  return undefined;
};
