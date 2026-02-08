import { z } from "zod";
import {
  garminConditionTypeSchema,
  garminEquipmentTypeSchema,
  garminStepTypeSchema,
  garminStrokeTypeSchema,
  garminTargetTypeSchema,
  garminUnitSchema,
} from "../common";

export const executableStepDTOSchema = z.object({
  type: z.literal("ExecutableStepDTO"),
  stepId: z.number().int().positive(),
  stepOrder: z.number().int().positive(),
  stepType: garminStepTypeSchema,
  childStepId: z.number().int().nullable(),
  description: z.string().nullable(),

  endCondition: garminConditionTypeSchema,
  endConditionValue: z.number(),
  preferredEndConditionUnit: garminUnitSchema.nullable(),
  endConditionCompare: z.number().nullable(),
  endConditionZone: z.number().nullable(),

  targetType: garminTargetTypeSchema,
  targetValueOne: z.number().nullable(),
  targetValueTwo: z.number().nullable(),
  targetValueUnit: garminUnitSchema.nullable(),
  zoneNumber: z.number().int().nullable(),

  secondaryTargetType: garminTargetTypeSchema.nullable(),
  secondaryTargetValueOne: z.number().nullable(),
  secondaryTargetValueTwo: z.number().nullable(),
  secondaryTargetValueUnit: garminUnitSchema.nullable(),
  secondaryZoneNumber: z.number().int().nullable(),

  strokeType: garminStrokeTypeSchema,
  equipmentType: garminEquipmentTypeSchema,

  category: z.string().nullable(),
  exerciseName: z.string().nullable(),
  weightValue: z.number().nullable(),
  weightUnit: garminUnitSchema.nullable(),

  workoutProvider: z.string().nullable(),
  providerExerciseSourceId: z.string().nullable(),
});

export type ExecutableStepDTO = z.infer<typeof executableStepDTOSchema>;
