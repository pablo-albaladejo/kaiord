/**
 * UI-Specific Schemas
 *
 * Zod schemas for UI-specific data structures.
 */

import { durationSchema, targetSchema } from "@kaiord/core";
import { z } from "zod";

/**
 * Step with ID schema (for UI rendering)
 */
export const workoutStepWithIdSchema = z.object({
  id: z.string().uuid(),
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
 * Validation error schema
 */
export const validationErrorSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
  code: z.string().optional(),
});

export type WorkoutStepWithId = z.infer<typeof workoutStepWithIdSchema>;
export type ValidationErrorType = z.infer<typeof validationErrorSchema>;
