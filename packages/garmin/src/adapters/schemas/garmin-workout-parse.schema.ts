import { z } from "zod";

export const executableStepParseSchema = z
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

export type ParsedExecutableStep = z.infer<typeof executableStepParseSchema>;

export type ParsedRepeatGroup = {
  type: "RepeatGroupDTO";
  numberOfIterations: number;
  workoutSteps: ParsedWorkoutStep[];
};

export type ParsedWorkoutStep = ParsedExecutableStep | ParsedRepeatGroup;

export const repeatGroupParseSchema: z.ZodType<ParsedRepeatGroup> = z.lazy(() =>
  z
    .object({
      type: z.literal("RepeatGroupDTO"),
      numberOfIterations: z.number(),
      workoutSteps: z.array(workoutStepParseSchema),
    })
    .passthrough()
);

export const workoutStepParseSchema: z.ZodType<ParsedWorkoutStep> = z.lazy(() =>
  z.union([executableStepParseSchema, repeatGroupParseSchema])
);

export const garminWorkoutParseSchema = z.object({
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

export type GarminWorkoutParsed = z.infer<typeof garminWorkoutParseSchema>;
