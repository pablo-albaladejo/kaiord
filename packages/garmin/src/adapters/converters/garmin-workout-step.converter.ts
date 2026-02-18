import type { WorkoutStep } from "@kaiord/core";
import type { GarminWorkoutStepInput } from "../schemas/input/types";
import { StepTypeId } from "../schemas/common";
import { mapDurationToCondition } from "../mappers/condition.mapper";
import { mapKrdEquipmentToGarmin } from "../mappers/equipment.mapper";
import {
  mapIntensityToStepType,
  type StepTypeKey,
} from "../mappers/intensity.mapper";
import {
  extractStrokeValue,
  fitValueToStroke,
  mapKrdStrokeToGarmin,
} from "../mappers/stroke.mapper";
import { mapKrdTargetToGarmin } from "../mappers/target.mapper";

const STEP_TYPE_IDS: Record<StepTypeKey, number> = {
  warmup: StepTypeId.WARMUP,
  cooldown: StepTypeId.COOLDOWN,
  interval: StepTypeId.INTERVAL,
  recovery: StepTypeId.RECOVERY,
  rest: StepTypeId.REST,
};

const STEP_TYPE_ORDER: Record<StepTypeKey, number> = {
  warmup: 1,
  cooldown: 2,
  interval: 3,
  recovery: 4,
  rest: 5,
};

const getStepTypeInfo = (intensity: string) => {
  const key = mapIntensityToStepType(intensity);
  return {
    stepTypeId: STEP_TYPE_IDS[key],
    stepTypeKey: key,
    displayOrder: STEP_TYPE_ORDER[key],
  };
};

export const mapWorkoutStep = (
  step: WorkoutStep,
  counter: { value: number }
): GarminWorkoutStepInput => {
  const stepOrder = counter.value++;
  const stepType = getStepTypeInfo(step.intensity ?? "active");
  const { endCondition, endConditionValue } = mapDurationToCondition(
    step.durationType,
    step.duration
  );
  const { targetType, targetValueOne, targetValueTwo, zoneNumber } =
    mapKrdTargetToGarmin(step.target);

  const strokeType =
    step.target.type === "stroke_type"
      ? mapKrdStrokeToGarmin(fitValueToStroke(extractStrokeValue(step.target)))
      : mapKrdStrokeToGarmin(undefined);

  const equipmentType = mapKrdEquipmentToGarmin(step.equipment);

  return {
    type: "ExecutableStepDTO",
    stepOrder,
    stepType,
    endCondition,
    endConditionValue,
    targetType,
    targetValueOne,
    targetValueTwo,
    zoneNumber,
    secondaryTargetType: null,
    secondaryTargetValueOne: null,
    secondaryTargetValueTwo: null,
    secondaryZoneNumber: null,
    strokeType,
    equipmentType,
    ...(step.notes ? { description: step.notes } : {}),
  };
};
