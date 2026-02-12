import { z } from "zod";

export const garminWorkoutSummarySchema = z.object({
  workoutId: z.number().or(z.string()),
  workoutName: z.string().optional(),
  sportType: z
    .object({ sportTypeKey: z.string().optional() })
    .optional(),
  createdDate: z.number().optional(),
  updatedDate: z.number().optional(),
});

export const garminPushResponseSchema = z.object({
  workoutId: z.number().or(z.string()),
  workoutName: z.string().optional(),
});
