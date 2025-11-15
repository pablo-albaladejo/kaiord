/**
 * Zod Schemas for Validation
 *
 * Re-exports core schemas and adds UI-specific validation schemas.
<<<<<<< HEAD
 *
 * This module consolidates schema exports from focused submodules.
 */

// Re-export core schemas from @kaiord/core
=======
 */

import { z } from "zod";

// ============================================
// Core Schemas (re-exported from @kaiord/core)
// ============================================

>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
export {
  durationSchema,
  durationTypeSchema,
  equipmentSchema,
  intensitySchema,
  krdEventSchema,
  krdLapSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
  repetitionBlockSchema,
  sportSchema,
  subSportSchema,
  swimStrokeSchema,
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
  workoutSchema,
  workoutStepSchema,
<<<<<<< HEAD
} from "./schemas/core-exports";

// Re-export form validation schemas
export type {
  PartialRepetitionBlock,
  PartialWorkoutStep,
  WorkoutMetadataForm,
} from "./schemas/form-schemas";

export {
  partialRepetitionBlockSchema,
  partialWorkoutStepSchema,
  workoutMetadataFormSchema,
} from "./schemas/form-schemas";

// Re-export UI-specific schemas
export type {
  ValidationErrorType,
  WorkoutStepWithId,
} from "./schemas/ui-schemas";

export {
  validationErrorSchema,
  workoutStepWithIdSchema,
} from "./schemas/ui-schemas";
=======
} from "@kaiord/core";

// ============================================
// UI-Specific Schemas
// ============================================

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
  duration: z.any().optional(), // Validated separately
  targetType: z
    .enum(["power", "heart_rate", "cadence", "pace", "stroke_type", "open"])
    .optional(),
  target: z.any().optional(), // Validated separately
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
  repeatCount: z.number().int().min(2).optional(),
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
  duration: z.any(), // Use core durationSchema
  targetType: z.enum([
    "power",
    "heart_rate",
    "cadence",
    "pace",
    "stroke_type",
    "open",
  ]),
  target: z.any(), // Use core targetSchema
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

export type PartialWorkoutStep = z.infer<typeof partialWorkoutStepSchema>;
export type PartialRepetitionBlock = z.infer<
  typeof partialRepetitionBlockSchema
>;
export type WorkoutMetadataForm = z.infer<typeof workoutMetadataFormSchema>;
export type WorkoutStepWithId = z.infer<typeof workoutStepWithIdSchema>;
export type ValidationErrorType = z.infer<typeof validationErrorSchema>;
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
