import { z } from "zod";
import { durationSchema } from "./duration";
import { equipmentSchema } from "./equipment";
import { intensitySchema } from "./intensity";
import { targetSchema } from "./target";

export const workoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  name: z.string().optional(),
  durationType: z.enum([
    "time",
    "distance",
    "heart_rate_less_than",
    "repeat_until_heart_rate_greater_than",
    "calories",
    "power_less_than",
    "power_greater_than",
    "repeat_until_time",
    "repeat_until_distance",
    "repeat_until_calories",
    "repeat_until_heart_rate_less_than",
    "repeat_until_power_less_than",
    "repeat_until_power_greater_than",
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
  intensity: intensitySchema.optional(),
  notes: z.string().max(256).optional(),
  equipment: equipmentSchema.optional(),
  extensions: z.record(z.unknown()).optional(),
});

export const repetitionBlockSchema = z.object({
  repeatCount: z.number().int().min(1),
  steps: z.array(workoutStepSchema),
});

export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
  poolLength: z.number().positive().optional(),
  poolLengthUnit: z.literal("meters").optional(),
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
  extensions: z.record(z.unknown()).optional(),
});

export type WorkoutStep = z.infer<typeof workoutStepSchema>;
export type RepetitionBlock = z.infer<typeof repetitionBlockSchema>;
export type Workout = z.infer<typeof workoutSchema>;
