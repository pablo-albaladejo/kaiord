import type { Target, TargetType, WorkoutStep } from "@kaiord/core";
import { mapConditionToDuration } from "../mappers/condition.mapper";
import { mapGarminEquipmentToKrd } from "../mappers/equipment.mapper";
import { mapStepTypeToIntensity } from "../mappers/intensity.mapper";
import {
  mapGarminStrokeToKrd,
  strokeToFitValue,
} from "../mappers/stroke.mapper";
import { mapGarminTargetToKrd } from "../mappers/target.mapper";
import type { ParsedExecutableStep } from "../schemas/garmin-workout-parse.schema";

export const mapExecutableStep = (
  step: ParsedExecutableStep,
  stepIndex: number
): WorkoutStep => {
  const { durationType, duration } = mapConditionToDuration(
    step.endCondition.conditionTypeKey,
    step.endConditionValue
  );

  const { targetType, target } = resolveTarget(step);
  const intensity = mapStepTypeToIntensity(step.stepType.stepTypeKey);
  const equipment = mapGarminEquipmentToKrd(
    step.equipmentType?.equipmentTypeKey ?? null
  );
  const stroke = mapGarminStrokeToKrd(
    step.strokeType?.strokeTypeKey ?? null,
    step.strokeType?.strokeTypeId ?? 0
  );

  const result: WorkoutStep = {
    stepIndex,
    durationType,
    duration,
    targetType,
    target,
    intensity,
  };

  if (equipment) result.equipment = equipment;

  if (stroke) {
    result.targetType = "stroke_type";
    result.target = {
      type: "stroke_type",
      value: { unit: "swim_stroke", value: strokeToFitValue(stroke) },
    };
  }

  return result;
};

const resolveTarget = (
  step: ParsedExecutableStep
): { targetType: TargetType; target: Target } => {
  const primary = mapGarminTargetToKrd(
    step.targetType.workoutTargetTypeKey,
    step.targetValueOne ?? null,
    step.targetValueTwo ?? null,
    step.zoneNumber ?? null
  );

  if (step.secondaryTargetType && primary.targetType === "open") {
    return mapGarminTargetToKrd(
      step.secondaryTargetType.workoutTargetTypeKey,
      step.secondaryTargetValueOne ?? null,
      step.secondaryTargetValueTwo ?? null,
      step.secondaryZoneNumber ?? null
    );
  }

  return primary;
};
