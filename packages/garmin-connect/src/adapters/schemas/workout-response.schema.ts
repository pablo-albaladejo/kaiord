import { z } from "zod";

/** GET /workout-service/workouts?start=N&limit=N - List workout summaries */
export const garminWorkoutSummarySchema = z.object({
  workoutId: z.number().or(z.string()),
  workoutName: z.string().optional(),
  sportType: z.object({ sportTypeKey: z.string().optional() }).optional(),
  createdDate: z.number().optional(),
  updatedDate: z.number().optional(),
});

/** POST /workout-service/workout - Push a workout (returns created workout) */
export const garminPushResponseSchema = z.object({
  workoutId: z.number().or(z.string()),
  workoutName: z.string().optional(),
});
