import { z } from "zod";
import type { GarminWorkoutStepInput } from "./types";
import { garminConditionTypeSchema, garminStepTypeSchema } from "../common";

export const repeatGroupDTOInputSchema: z.ZodType<{
  type: "RepeatGroupDTO";
  stepOrder: number;
  stepType: z.infer<typeof garminStepTypeSchema>;
  numberOfIterations: number;
  smartRepeat?: boolean;
  endCondition: z.infer<typeof garminConditionTypeSchema>;
  endConditionValue: number;
  workoutSteps: GarminWorkoutStepInput[];
  childStepId?: number | null;
  description?: string;
}> = z.lazy(() =>
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

export type RepeatGroupDTOInput = z.infer<typeof repeatGroupDTOInputSchema>;

import { executableStepDTOInputSchema } from "./step-input.schema";

export const garminWorkoutStepInputSchema: z.ZodType<GarminWorkoutStepInput> =
  z.lazy(() =>
    z.union([executableStepDTOInputSchema, repeatGroupDTOInputSchema])
  );
