import { z } from "zod";

export const ConditionTypeId = {
  LAP_BUTTON: 1,
  TIME: 2,
  DISTANCE: 3,
  CALORIES: 4,
  HEART_RATE: 5,
  POWER: 6,
  ITERATIONS: 7,
  FIXED_REST: 8,
  REPS: 10,
} as const;

export const conditionTypeKeySchema = z.enum([
  "lap.button",
  "time",
  "distance",
  "calories",
  "heart.rate",
  "power",
  "iterations",
  "fixed.rest",
  "reps",
]);

export const garminConditionTypeSchema = z.object({
  conditionTypeId: z.number().int().positive(),
  conditionTypeKey: conditionTypeKeySchema,
  displayOrder: z.number().int().nonnegative(),
  displayable: z.boolean(),
});

export type GarminConditionType = z.infer<typeof garminConditionTypeSchema>;
