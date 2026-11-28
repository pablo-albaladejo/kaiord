import {
  type Logger,
  STEP_NOTE_MAX,
  type Target,
  type TargetType,
  type WorkoutStep,
} from "@kaiord/core";

import { mapConditionToDuration } from "../mappers/condition.mapper";
import { mapGarminEquipmentToKrd } from "../mappers/equipment.mapper";
import { mapStepTypeToIntensity } from "../mappers/intensity.mapper";
import {
  mapGarminStrokeToKrd,
  strokeToFitValue,
} from "../mappers/stroke.mapper";
import type { ParsedExecutableStep } from "../schemas/garmin-workout-parse.schema";
import { equipmentKeyOf, strokeKeyOf } from "./garmin-type-key.converter";
import { convertGarminTargetToKrd } from "./target-from-garmin.converter";

export const mapExecutableStep = (
  step: ParsedExecutableStep,
  stepIndex: number,
  logger?: Logger
): WorkoutStep => {
  const { durationType, duration } = mapConditionToDuration(
    step.endCondition.conditionTypeKey,
    step.endConditionValue,
    logger
  );

  const { targetType, target } = resolveTarget(step);
  const intensity = mapStepTypeToIntensity(step.stepType.stepTypeKey, logger);
  const equipment = mapGarminEquipmentToKrd(equipmentKeyOf(step));
  const stroke = mapGarminStrokeToKrd(
    strokeKeyOf(step),
    step.strokeType?.strokeTypeId ?? 0,
    logger
  );

  const result: WorkoutStep = {
    stepIndex,
    durationType,
    duration,
    targetType,
    target,
    intensity,
  };

  if (step.description) {
    result.notes = truncateNotes(step.description, stepIndex, logger);
  }
  if (equipment) result.equipment = equipment;
  if (stroke) applyStroke(result, stroke);

  return result;
};

const applyStroke = (result: WorkoutStep, stroke: string): void => {
  result.targetType = "stroke_type";
  result.target = {
    type: "stroke_type",
    value: { unit: "swim_stroke", value: strokeToFitValue(stroke) },
  };
};

const resolveTarget = (
  step: ParsedExecutableStep
): { targetType: TargetType; target: Target } => {
  const primary = convertGarminTargetToKrd(
    step.targetType.workoutTargetTypeKey,
    step.targetValueOne ?? null,
    step.targetValueTwo ?? null,
    step.zoneNumber ?? null
  );

  if (step.secondaryTargetType && primary.targetType === "open") {
    return convertGarminTargetToKrd(
      step.secondaryTargetType.workoutTargetTypeKey,
      step.secondaryTargetValueOne ?? null,
      step.secondaryTargetValueTwo ?? null,
      step.secondaryZoneNumber ?? null
    );
  }

  return primary;
};

const truncateNotes = (
  notes: string,
  stepIndex: number,
  logger?: Logger
): string => {
  if (notes.length <= STEP_NOTE_MAX) return notes;
  logger?.warn(
    `Lossy conversion: step notes truncated to ${STEP_NOTE_MAX} characters`,
    { stepIndex, originalLength: notes.length }
  );
  return notes.slice(0, STEP_NOTE_MAX);
};
