import { z } from "zod";
import {
  garminConditionTypeSchema,
  garminEquipmentTypeSchema,
  garminStepTypeSchema,
  garminStrokeTypeSchema,
  garminTargetTypeSchema,
  garminUnitSchema,
} from "../common";

export const executableStepDTOInputSchema = z.object({
  type: z.literal("ExecutableStepDTO"),
  stepId: z.number().int().positive().optional(),
  stepOrder: z.number().int().positive(),
  stepType: garminStepTypeSchema,
  childStepId: z.number().int().positive().nullable().optional(),
  description: z.string().max(500).optional(),

  endCondition: garminConditionTypeSchema,
  endConditionValue: z.number().nonnegative(),
  endConditionCompare: z.number().nullable().optional(),
  endConditionZone: z.number().int().nullable().optional(),

  targetType: garminTargetTypeSchema,
  targetValueOne: z.union([z.string(), z.number()]).nullable().optional(),
  targetValueTwo: z.union([z.string(), z.number()]).nullable().optional(),
  targetValueUnit: garminUnitSchema.optional(),
  zoneNumber: z.number().int().positive().nullable().optional(),

  secondaryTargetType: garminTargetTypeSchema.nullable().optional(),
  secondaryTargetValueOne: z
    .union([z.string(), z.number()])
    .nullable()
    .optional(),
  secondaryTargetValueTwo: z
    .union([z.string(), z.number()])
    .nullable()
    .optional(),
  secondaryTargetValueUnit: garminUnitSchema.optional(),
  secondaryZoneNumber: z.number().int().positive().nullable().optional(),

  strokeType: garminStrokeTypeSchema.optional(),
  equipmentType: garminEquipmentTypeSchema.optional(),

  category: z.string().nullable().optional(),
  exerciseName: z.string().nullable().optional(),
  weightValue: z.number().nullable().optional(),
  weightUnit: garminUnitSchema.optional(),

  workoutProvider: z.string().nullable().optional(),
  providerExerciseSourceId: z.string().nullable().optional(),
});

export type ExecutableStepDTOInput = z.infer<
  typeof executableStepDTOInputSchema
>;
