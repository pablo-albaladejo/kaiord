import type { Workout } from "../schemas/workout";
import { workoutSchema } from "../schemas/workout";
import { createKrdValidationError } from "../types/errors";
import { mapZodErrors } from "./map-zod-errors";

/**
 * Validates unknown input against workoutSchema, throwing a KrdValidationError
 * with field-level detail when parsing fails. Shared by createWorkoutKRD and
 * extractWorkout so both surface identical "Invalid workout: ..." messages.
 */
export const parseWorkoutOrThrow = (input: unknown): Workout => {
  const result = workoutSchema.safeParse(input);

  if (!result.success) {
    const errors = mapZodErrors(result.error.issues);
    throw createKrdValidationError(
      `Invalid workout: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
      errors
    );
  }

  return result.data;
};
