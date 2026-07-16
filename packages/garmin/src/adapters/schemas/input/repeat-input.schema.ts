import { z } from "zod";

import { garminConditionTypeSchema, garminStepTypeSchema } from "../common";
import { executableStepDTOInputSchema } from "./step-input.schema";
import type { GarminWorkoutStepInput, RepeatGroupDTOInputType } from "./types";

export const repeatGroupDTOInputSchema: z.ZodType<RepeatGroupDTOInputType> =
  z.lazy(() =>
    z.object({
      type: z.literal("RepeatGroupDTO"),
      stepOrder: z.number().int().positive(),
      stepType: garminStepTypeSchema,
      numberOfIterations: z.number().int().positive().min(1).max(99),
      smartRepeat: z.boolean().optional(),
      endCondition: garminConditionTypeSchema,
      endConditionValue: z.number(),
      workoutSteps: z.array(garminWorkoutStepInputSchema).min(1),
      childStepId: z.number().int().positive().nullable().optional(),
      description: z.string().max(500).optional(),
    })
  );

export const garminWorkoutStepInputSchema: z.ZodType<GarminWorkoutStepInput> =
  z.lazy(() =>
    z.union([executableStepDTOInputSchema, repeatGroupDTOInputSchema])
  );
