import type { WorkoutStep } from "../../domain/schemas/workout";
import { mapDuration, mapDurationType } from "./duration.mapper";
import { mapTarget, mapTargetType } from "./target.mapper";
import type { FitWorkoutStep } from "./types";

export const mapStep = (step: FitWorkoutStep, index: number): WorkoutStep => {
  const duration = mapDuration(step);
  const target = mapTarget(step);

  return {
    stepIndex: step.messageIndex ?? index,
    durationType: mapDurationType(step.durationType),
    duration,
    targetType: mapTargetType(step.targetType),
    target,
  };
};
