import { z } from "zod";
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
import { mapConditionToDuration } from "../mappers/condition.mapper";
import { mapGarminEquipmentToKrd } from "../mappers/equipment.mapper";
import { mapStepTypeToIntensity } from "../mappers/intensity.mapper";
import { mapGarminSportToKrd } from "../mappers/sport.mapper";
import { mapGarminStrokeToKrd } from "../mappers/stroke.mapper";
import { mapGarminTargetToKrd } from "../mappers/target.mapper";

const executableStepParseSchema = z
  .object({
    type: z.literal("ExecutableStepDTO"),
    stepType: z.object({ stepTypeKey: z.string() }).passthrough(),
    endCondition: z.object({ conditionTypeKey: z.string() }).passthrough(),
    endConditionValue: z.number(),
    targetType: z.object({ workoutTargetTypeKey: z.string() }).passthrough(),
    targetValueOne: z.number().nullable().optional(),
    targetValueTwo: z.number().nullable().optional(),
    zoneNumber: z.number().nullable().optional(),
    secondaryTargetType: z
      .object({ workoutTargetTypeKey: z.string() })
      .passthrough()
      .nullable()
      .optional(),
    secondaryTargetValueOne: z.number().nullable().optional(),
    secondaryTargetValueTwo: z.number().nullable().optional(),
    secondaryZoneNumber: z.number().nullable().optional(),
    strokeType: z
      .object({
        strokeTypeKey: z.string().nullable().optional(),
        strokeTypeId: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    equipmentType: z
      .object({ equipmentTypeKey: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

type ParsedExecutableStep = z.infer<typeof executableStepParseSchema>;

type ParsedRepeatGroup = {
  type: "RepeatGroupDTO";
  numberOfIterations: number;
  workoutSteps: ParsedWorkoutStep[];
};

type ParsedWorkoutStep = ParsedExecutableStep | ParsedRepeatGroup;

const repeatGroupParseSchema: z.ZodType<ParsedRepeatGroup> = z.lazy(() =>
  z
    .object({
      type: z.literal("RepeatGroupDTO"),
      numberOfIterations: z.number(),
      workoutSteps: z.array(workoutStepParseSchema),
    })
    .passthrough()
);

const workoutStepParseSchema: z.ZodType<ParsedWorkoutStep> = z.lazy(() =>
  z.union([executableStepParseSchema, repeatGroupParseSchema])
);

const garminWorkoutParseSchema = z.object({
  sportType: z
    .object({ sportTypeKey: z.string() })
    .passthrough()
    .nullable()
    .optional(),
  workoutName: z.string().optional(),
  workoutSegments: z
    .array(
      z
        .object({
          workoutSteps: z.array(workoutStepParseSchema).optional(),
        })
        .passthrough()
    )
    .optional(),
  poolLength: z.number().nullable().optional(),
});

type GarminWorkoutParsed = z.infer<typeof garminWorkoutParseSchema>;

export const convertGarminToKRD = (gcnString: string, logger: Logger): KRD => {
  logger.info("Parsing Garmin Connect JSON");

  let parsed: unknown;
  try {
    parsed = JSON.parse(gcnString);
  } catch (error) {
    throw createGarminParsingError("Invalid JSON in GCN file", error);
  }

  const result = garminWorkoutParseSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw createGarminParsingError(`Invalid GCN data: ${issues}`);
  }

  const gcn = result.data;
  const sport = mapGarminSportToKrd(gcn.sportType?.sportTypeKey ?? "");
  const workoutName = gcn.workoutName ?? "";
  const segments = gcn.workoutSegments ?? [];
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
    metadata: { created: now, sport, manufacturer: "garmin-connect" },
    extensions: { structured_workout: workout },
  };
};

type ParsedSegment = NonNullable<
  GarminWorkoutParsed["workoutSegments"]
>[number];

const flattenSegmentsToSteps = (
  segments: ParsedSegment[],
  logger: Logger
): Array<WorkoutStep | RepetitionBlock> => {
  const allSteps: Array<WorkoutStep | RepetitionBlock> = [];
  let stepIndex = 0;

  for (const segment of segments) {
    for (const step of segment.workoutSteps ?? []) {
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

const mapRepeatGroup = (
  group: ParsedRepeatGroup,
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

  return { repeatCount: group.numberOfIterations, steps };
};

const addPoolLength = (gcn: GarminWorkoutParsed, workout: Workout): void => {
  const poolLength = gcn.poolLength;
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
