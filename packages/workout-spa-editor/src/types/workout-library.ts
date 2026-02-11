/**
 * Workout Library Types and Schemas
 *
 * Defines workout template data for saving and loading workouts from the library.
 */

import { z } from "zod";
import { krdSchema } from "./schemas";

/**
 * Difficulty Level Schema
 *
 * Represents the difficulty level of a workout.
 */
export const difficultyLevelSchema = z.enum([
  "easy",
  "moderate",
  "hard",
  "very_hard",
]);

export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;

/**
 * Workout Template Schema
 *
 * Represents a saved workout in the library with metadata for organization.
 */
export const workoutTemplateSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
  sport: z.string().min(1).max(50),
  krd: krdSchema,
  tags: z.array(z.string().min(1).max(50)).default([]),
  difficulty: difficultyLevelSchema.optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  thumbnailData: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;

/**
 * Workout Library State Schema
 *
 * Represents the complete library state for persistence.
 */
export const workoutLibraryStateSchema = z.object({
  templates: z.array(workoutTemplateSchema),
});

export type WorkoutLibraryState = z.infer<typeof workoutLibraryStateSchema>;
