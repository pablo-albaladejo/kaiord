/**
 * Form Validation Schemas
 *
 * Zod schemas for form validation with partial/optional fields.
 */

import { durationSchema, targetSchema } from "@kaiord/core";
import { z } from "zod";

/**
 * Partial workout step schema for form validation
 * Allows incomplete data while user is editing
 */
export const partialWorkoutStepSchema = z.object({
  stepIndex: z.number().int().nonnegative().optional(),
  name: z.string().max(256).optional(),
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
    .optional(),
  duration: durationSchema.optional(),
  targetType: z
    .enum(["power", "heart_rate", "cadence", "pace", "stroke_type", "open"])
    .optional(),
  target: targetSchema.optional(),
  intensity: z.enum(["warmup", "active", "cooldown", "rest"]).optional(),
  notes: z.string().max(256).optional(),
  equipment: z
    .enum([
      "swim_fins",
      "swim_kickboard",
      "swim_paddles",
      "swim_pull_buoy",
      "swim_snorkel",
    ])
    .optional(),
});

/**
 * Partial repetition block schema for form validation
 */
export const partialRepetitionBlockSchema = z.object({
  repeatCount: z.number().int().min(1).optional(),
  steps: z.array(partialWorkoutStepSchema).optional(),
});

/**
 * Workout metadata schema for initial setup
 */
export const workoutMetadataFormSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  sport: z.string().min(1),
  subSport: z.string().optional(),
  poolLength: z.number().positive().optional(),
  poolLengthUnit: z.literal("meters").optional(),
});

export type PartialWorkoutStep = z.infer<typeof partialWorkoutStepSchema>;
export type PartialRepetitionBlock = z.infer<
  typeof partialRepetitionBlockSchema
>;
export type WorkoutMetadataForm = z.infer<typeof workoutMetadataFormSchema>;
