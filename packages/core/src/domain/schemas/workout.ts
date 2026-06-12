import { z } from "zod";

import { sportSchema } from "./sport";
import { subSportSchema } from "./sub-sport";
import { workoutStepSchema } from "./workout-step";

export type { WorkoutStep } from "./workout-step";
export { workoutStepSchema } from "./workout-step";

/**
 * Zod schema for a repetition block.
 *
 * Validates a group of workout steps that repeat multiple times.
 */
export const repetitionBlockSchema = z.object({
  id: z.string().optional(),
  repeatCount: z.number().int().min(1),
  steps: z.array(workoutStepSchema),
});

/**
 * Zod schema for a complete workout definition.
 *
 * Validates a structured workout with metadata and a sequence of steps
 * or repetition blocks.
 *
 * `stepIndex` values on steps are advisory ordering metadata: producers
 * SHOULD emit 0-based contiguous indices, but the schema deliberately
 * does not enforce contiguity or uniqueness — adapters renumber steps
 * when flattening repetition blocks (see the garmin adapter's
 * flatten-segments converter) and consumers MUST rely on array order,
 * not on index arithmetic.
 *
 * `poolLength` is bounded to [1, 655] meters — generous enough for
 * endless pools (~5 m) and the FIT protocol envelope, while rejecting
 * nonsense values like 0.0001 or 99999. KRD always stores pool length
 * normalized to meters; adapters that accept yard-based pools convert on
 * ingest (see `length-unit.converter`), so `poolLengthUnit` is fixed to
 * `"meters"` here rather than carrying the source unit.
 */
export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: sportSchema,
  subSport: subSportSchema.optional(),
  /** meters — always normalized to meters on ingest */
  poolLength: z.number().min(1).max(655).optional(),
  poolLengthUnit: z.literal("meters").optional(),
  steps: z.array(z.union([workoutStepSchema, repetitionBlockSchema])),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

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
