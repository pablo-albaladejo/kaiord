import type {
  KRD,
  Logger,
  RepetitionBlock,
  Target,
  TargetType,
  Workout,
  WorkoutStep,
} from "@kaiord/core";
import { createGarminParsingError } from "@kaiord/core";
import type { ExecutableStepDTO } from "../schemas/output";
import type { GarminWorkoutStep } from "../schemas/output/types";
import { mapConditionToDuration } from "../mappers/condition.mapper";
import { mapGarminEquipmentToKrd } from "../mappers/equipment.mapper";
import { mapStepTypeToIntensity } from "../mappers/intensity.mapper";
import { mapGarminSportToKrd } from "../mappers/sport.mapper";
import { mapGarminStrokeToKrd } from "../mappers/stroke.mapper";
import { mapGarminTargetToKrd } from "../mappers/target.mapper";

export const convertGarminToKRD = (gcnString: string, logger: Logger): KRD => {
  logger.info("Parsing Garmin Connect JSON");

  let parsed: unknown;
  try {
    parsed = JSON.parse(gcnString);
  } catch (error) {
    throw createGarminParsingError("Invalid JSON in GCN file", error);
  }

  const gcn = parsed as Record<string, unknown>;
  if (!gcn || typeof gcn !== "object") {
    throw createGarminParsingError("GCN data is not an object");
  }

  const sportType = gcn.sportType as {
    sportTypeKey: string;
  } | null;
  const sport = mapGarminSportToKrd(sportType?.sportTypeKey ?? "");
  const workoutName = (gcn.workoutName as string) ?? "";
  const segments =
    (gcn.workoutSegments as Array<Record<string, unknown>>) ?? [];

  const steps = flattenSegmentsToSteps(segments, logger);

  const workout: Workout = {
    name: workoutName.substring(0, 255),
    sport,
    steps,
  };

  addPoolLength(gcn, workout);

  const now = new Date().toISOString();

  return {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: now,
      sport,
      manufacturer: "garmin-connect",
    },
    extensions: {
      structured_workout: workout,
    },
  };
};

const flattenSegmentsToSteps = (
  segments: Array<Record<string, unknown>>,
  logger: Logger
): Array<WorkoutStep | RepetitionBlock> => {
  const allSteps: Array<WorkoutStep | RepetitionBlock> = [];
  let stepIndex = 0;

  for (const segment of segments) {
    const workoutSteps = (segment.workoutSteps as GarminWorkoutStep[]) ?? [];

    for (const step of workoutSteps) {
      if (step.type === "RepeatGroupDTO") {
        const block = mapRepeatGroup(step, stepIndex, logger);
        stepIndex += block.steps.length;
        allSteps.push(block);
      } else {
        allSteps.push(mapExecutableStep(step, stepIndex));
        stepIndex++;
      }
    }
  }

  return allSteps;
};

const mapExecutableStep = (
  step: ExecutableStepDTO,
  stepIndex: number
): WorkoutStep => {
  const conditionKey = step.endCondition.conditionTypeKey;
  const { durationType, duration } = mapConditionToDuration(
    conditionKey,
    step.endConditionValue
  );

  const { targetType, target } = resolveTarget(step);
  const intensity = mapStepTypeToIntensity(step.stepType.stepTypeKey);
  const equipment = mapGarminEquipmentToKrd(
    step.equipmentType.equipmentTypeKey
  );
  const stroke = mapGarminStrokeToKrd(
    step.strokeType.strokeTypeKey,
    step.strokeType.strokeTypeId
  );

  const result: WorkoutStep = {
    stepIndex,
    durationType,
    duration,
    targetType: targetType as TargetType,
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
  step: ExecutableStepDTO
): { targetType: string; target: Target } => {
  const primary = mapGarminTargetToKrd(
    step.targetType.workoutTargetTypeKey,
    step.targetValueOne,
    step.targetValueTwo,
    step.zoneNumber
  );

  if (step.secondaryTargetType && primary.targetType === "open") {
    return mapGarminTargetToKrd(
      step.secondaryTargetType.workoutTargetTypeKey,
      step.secondaryTargetValueOne,
      step.secondaryTargetValueTwo,
      step.secondaryZoneNumber
    );
  }

  return primary;
};

type RepeatGroupLike = {
  numberOfIterations: number;
  workoutSteps: GarminWorkoutStep[];
};

const mapRepeatGroup = (
  group: RepeatGroupLike,
  startIndex: number,
  logger: Logger
): RepetitionBlock => {
  const steps: WorkoutStep[] = [];
  let idx = startIndex;

  for (const step of group.workoutSteps) {
    if (step.type === "ExecutableStepDTO") {
      steps.push(mapExecutableStep(step, idx));
      idx++;
    } else {
      logger.warn("Nested repeat groups are flattened", {
        iterations: step.numberOfIterations,
      });
      const nested = mapRepeatGroup(step, idx, logger);
      for (const s of nested.steps) {
        steps.push({ ...s, stepIndex: idx });
        idx++;
      }
    }
  }

  return {
    repeatCount: group.numberOfIterations,
    steps,
  };
};

const addPoolLength = (
  gcn: Record<string, unknown>,
  workout: Workout
): void => {
  const poolLength = gcn.poolLength as number | null;
  if (poolLength && poolLength > 0) {
    workout.poolLength = poolLength;
    workout.poolLengthUnit = "meters";
  }
};

const STROKE_TO_FIT: Record<string, number> = {
  freestyle: 0,
  backstroke: 1,
  breaststroke: 2,
  butterfly: 3,
  drill: 4,
  mixed: 5,
  im: 5,
};

const strokeToFitValue = (stroke: string): number => STROKE_TO_FIT[stroke] ?? 0;
