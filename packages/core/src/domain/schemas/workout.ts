import { z } from "zod";
import { durationSchema } from "./duration";
import { intensityEnum } from "./intensity";
import { targetSchema } from "./target";

export const workoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  name: z.string().optional(),
  durationType: z.enum([
    "time",
    "distance",
    "heart_rate_less_than",
    "heart_rate_greater_than",
    "open",
  ]),
  duration: durationSchema,
  targetType: z.enum([
    "power",
    "heart_rate",
    "cadence",
    "pace",
    "stroke_type",
    "open",
  ]),
  target: targetSchema,
  intensity: intensityEnum.optional(),
  notes: z.string().max(256).optional(),
});

export const repetitionBlockSchema = z.object({
  repeatCount: z.number().int().min(2),
  steps: z.array(workoutStepSchema),
});

export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
});

export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type RepetitionBlock = z.infer<typeof repetitionBlockSchema>;
export type Workout = z.infer<typeof workoutSchema>;
