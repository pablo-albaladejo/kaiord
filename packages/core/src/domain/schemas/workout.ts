import { z } from "zod";
import { durationSchema } from "./duration";
import { targetSchema } from "./target";

export const workoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  durationType: z.enum(["time", "distance", "open"]),
  duration: durationSchema,
  targetType: z.enum(["power", "heart_rate", "cadence", "pace", "open"]),
  target: targetSchema,
});

export const repetitionBlockSchema = z.object({
  repeatCount: z.number().int().min(2),
  steps: z.array(workoutStepSchema),
});

export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: z.string(),
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
});

export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type RepetitionBlock = z.infer<typeof repetitionBlockSchema>;
export type Workout = z.infer<typeof workoutSchema>;
