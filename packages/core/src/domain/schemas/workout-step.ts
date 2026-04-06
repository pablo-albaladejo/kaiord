import { z } from "zod";
import { durationSchema } from "./duration";
import { equipmentSchema } from "./equipment";
import { intensitySchema } from "./intensity";
import { targetSchema } from "./target";

/**
 * Zod schema for a workout step.
 *
 * Validates an individual interval or segment within a workout,
 * including duration, target, and intensity.
 */
export const workoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  name: z.string().optional(),
  durationType: z
    .enum([
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
    ])
    .describe("Must match duration.type"),
  duration: durationSchema,
  targetType: z
    .enum(["power", "heart_rate", "cadence", "pace", "stroke_type", "open"])
    .describe("Must match target.type"),
  target: targetSchema,
  intensity: intensitySchema.optional(),
  notes: z.string().max(256).optional(),
  equipment: equipmentSchema.optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

/**
 * TypeScript type for a workout step, inferred from {@link workoutStepSchema}.
 *
 * Represents an individual interval or segment within a workout.
 */
export type WorkoutStep = z.infer<typeof workoutStepSchema>;
