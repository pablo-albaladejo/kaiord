import { z } from "zod";
import type { GarminWorkoutStep } from "./types";
import {
  garminConditionTypeSchema,
  garminStepTypeSchema,
  garminUnitSchema,
} from "../common";

export const repeatGroupDTOSchema: z.ZodType<{
  type: "RepeatGroupDTO";
  stepId: number;
  stepOrder: number;
  stepType: z.infer<typeof garminStepTypeSchema>;
  childStepId: number | null;
  numberOfIterations: number;
  smartRepeat: boolean | null;
  skipLastRestStep: boolean | null;
  endCondition: z.infer<typeof garminConditionTypeSchema>;
  endConditionValue: number;
  preferredEndConditionUnit: z.infer<typeof garminUnitSchema> | null;
  endConditionCompare: number | null;
  workoutSteps: GarminWorkoutStep[];
  description: string | null;
}> = z.lazy(() =>
  z.object({
    type: z.literal("RepeatGroupDTO"),
    stepId: z.number().int().positive(),
    stepOrder: z.number().int().positive(),
    stepType: garminStepTypeSchema,
    childStepId: z.number().int().nullable(),
    numberOfIterations: z.number().int().positive(),
    smartRepeat: z.boolean().nullable(),
    skipLastRestStep: z.boolean().nullable(),
    endCondition: garminConditionTypeSchema,
    endConditionValue: z.number(),
    preferredEndConditionUnit: garminUnitSchema.nullable(),
    endConditionCompare: z.number().nullable(),
    workoutSteps: z.array(garminWorkoutStepSchema),
    description: z.string().nullable(),
  })
);

export type RepeatGroupDTO = z.infer<typeof repeatGroupDTOSchema>;

// Must be defined after repeatGroupDTOSchema to avoid circular issues
import { executableStepDTOSchema } from "./step.schema";

export const garminWorkoutStepSchema: z.ZodType<GarminWorkoutStep> = z.lazy(
  () => z.union([executableStepDTOSchema, repeatGroupDTOSchema])
);
