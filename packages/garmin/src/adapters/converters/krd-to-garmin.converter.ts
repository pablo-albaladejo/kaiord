import type {
  KRD,
  Logger,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "@kaiord/core";
import { createGarminParsingError, workoutSchema } from "@kaiord/core";
import { ConditionTypeId, StepTypeId } from "../schemas/common";
import type { GarminWorkoutStepInput } from "../schemas/input/types";
import { mapDurationToCondition } from "../mappers/condition.mapper";
import { mapKrdEquipmentToGarmin } from "../mappers/equipment.mapper";
import {
  mapIntensityToStepType,
  type StepTypeKey,
} from "../mappers/intensity.mapper";
import { mapKrdSportToGarmin } from "../mappers/sport.mapper";
import { mapKrdStrokeToGarmin } from "../mappers/stroke.mapper";
import { mapKrdTargetToGarmin } from "../mappers/target.mapper";

export const convertKRDToGarmin = (krd: KRD, logger: Logger): string => {
  logger.info("Converting KRD to Garmin Connect JSON");

  const workout = extractWorkout(krd);
  if (!workout) {
    throw createGarminParsingError("KRD does not contain a structured workout");
  }

  const sportType = mapKrdSportToGarmin(workout.sport);
  const counter = { value: 1 };

  const workoutSteps: GarminWorkoutStepInput[] = workout.steps.map((step) =>
    isRepetitionBlock(step)
      ? mapRepetitionBlock(step, counter)
      : mapWorkoutStep(step, counter)
  );

  const input = {
    sportType,
    workoutName: (workout.name ?? "Kaiord Workout").substring(0, 255),
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType,
        workoutSteps,
      },
    ],
    poolLength: undefined as number | undefined,
    poolLengthUnit: undefined as
      | { unitId: number; unitKey: string; factor: number }
      | undefined,
  };

  addPoolInfo(workout, input);

  logger.info("KRD to Garmin GCN conversion complete");
  return JSON.stringify(input, null, 2);
};

const extractWorkout = (krd: KRD): Workout | undefined => {
  const ext = krd.extensions?.structured_workout;
  if (!ext || typeof ext !== "object") return undefined;

  const result = workoutSchema.safeParse(ext);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw createGarminParsingError(`Invalid workout data: ${issues}`);
  }

  return result.data;
};

const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => "repeatCount" in step;

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

const mapWorkoutStep = (
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
  };
};

const mapRepetitionBlock = (
  block: RepetitionBlock,
  counter: { value: number }
): GarminWorkoutStepInput => {
  const stepOrder = counter.value++;
  const innerSteps: GarminWorkoutStepInput[] = block.steps.map((step) =>
    mapWorkoutStep(step, counter)
  );

  return {
    type: "RepeatGroupDTO",
    stepOrder,
    stepType: {
      stepTypeId: StepTypeId.REPEAT,
      stepTypeKey: "repeat",
      displayOrder: 6,
    },
    numberOfIterations: block.repeatCount,
    endCondition: {
      conditionTypeId: ConditionTypeId.ITERATIONS,
      conditionTypeKey: "iterations",
      displayOrder: 7,
      displayable: false,
    },
    endConditionValue: block.repeatCount,
    workoutSteps: innerSteps,
  };
};

type PoolInput = {
  poolLength?: number;
  poolLengthUnit?: { unitId: number; unitKey: string; factor: number };
};

const addPoolInfo = (workout: Workout, input: PoolInput): void => {
  if (workout.poolLength && workout.poolLength > 0) {
    input.poolLength = workout.poolLength;
    input.poolLengthUnit = {
      unitId: 1,
      unitKey: "meter",
      factor: 100,
    };
  }
};

const FIT_TO_STROKE: Record<number, string> = {
  0: "freestyle",
  1: "backstroke",
  2: "breaststroke",
  3: "butterfly",
  4: "drill",
  5: "mixed",
};

const extractStrokeValue = (target: { value?: { value: number } }): number => {
  return target.value?.value ?? 0;
};

const fitValueToStroke = (value: number): string | undefined =>
  FIT_TO_STROKE[value];
