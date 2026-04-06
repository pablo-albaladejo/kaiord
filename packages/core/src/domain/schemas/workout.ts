import { z } from "zod";
import { sportSchema } from "./sport";
import { subSportSchema } from "./sub-sport";
import { workoutStepSchema } from "./workout-step";

export { workoutStepSchema } from "./workout-step";
export type { WorkoutStep } from "./workout-step";

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
 */
export const workoutSchema = z.object({
  name: z.string().optional(),
  sport: sportSchema,
  subSport: subSportSchema.optional(),
  poolLength: z.number().positive().optional(),
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
