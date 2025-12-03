import { z } from "zod";
import { durationSchema } from "./duration";
import { equipmentSchema } from "./equipment";
import { intensitySchema } from "./intensity";
import { targetSchema } from "./target";

/**
 * Zod schema for a workout step.
 *
 * Validates an individual interval or segment within a workout, including duration, target, and intensity.
 *
 * @example
 * ```typescript
 * import { workoutStepSchema } from '@kaiord/core';
 *
 * const step = workoutStepSchema.parse({
 *   stepIndex: 0,
 *   durationType: 'time',
 *   duration: { type: 'time', seconds: 600 },
 *   targetType: 'heart_rate',
 *   target: { type: 'heart_rate', value: { unit: 'zone', value: 2 } },
 *   intensity: 'warmup',
 *   notes: 'Easy warmup, focus on form'
 * });
 * ```
 */
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

/**
 * Zod schema for a repetition block.
 *
 * Validates a group of workout steps that repeat multiple times.
 *
 * @example
 * ```typescript
 * import { repetitionBlockSchema } from '@kaiord/core';
 *
 * const block = repetitionBlockSchema.parse({
 *   id: 'block-123',
 *   repeatCount: 5,
 *   steps: [
 *     {
 *       stepIndex: 0,
 *       durationType: 'time',
 *       duration: { type: 'time', seconds: 300 },
 *       targetType: 'power',
 *       target: { type: 'power', value: { unit: 'watts', value: 250 } }
 *     }
 *   ]
 * });
 * ```
 */
export const repetitionBlockSchema = z.object({
  id: z.string().optional(),
  repeatCount: z.number().int().min(1),
  steps: z.array(workoutStepSchema),
});

/**
 * Zod schema for a complete workout definition.
 *
 * Validates a structured workout with metadata and a sequence of steps or repetition blocks.
 *
 * @example
 * ```typescript
 * import { workoutSchema } from '@kaiord/core';
 *
 * const workout = workoutSchema.parse({
 *   name: 'Trail Run Workout',
 *   sport: 'running',
 *   subSport: 'trail',
 *   steps: [
 *     {
 *       stepIndex: 0,
 *       durationType: 'time',
 *       duration: { type: 'time', seconds: 600 },
 *       targetType: 'heart_rate',
 *       target: { type: 'heart_rate', value: { unit: 'zone', value: 2 } },
 *       intensity: 'warmup'
 *     }
 *   ]
 * });
 * ```
 */
export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
  poolLength: z.number().positive().optional(),
  poolLengthUnit: z.literal("meters").optional(),
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
  extensions: z.record(z.unknown()).optional(),
});

/**
 * TypeScript type for a workout step, inferred from {@link workoutStepSchema}.
 *
 * Represents an individual interval or segment within a workout.
 */
export type WorkoutStep = z.infer<typeof workoutStepSchema>;

/**
 * TypeScript type for a repetition block, inferred from {@link repetitionBlockSchema}.
 *
 * Represents a group of workout steps that repeat multiple times.
 */
export type RepetitionBlock = z.infer<typeof repetitionBlockSchema>;

/**
 * TypeScript type for a complete workout, inferred from {@link workoutSchema}.
 *
 * Represents a structured workout definition with metadata and steps.
 */
export type Workout = z.infer<typeof workoutSchema>;
