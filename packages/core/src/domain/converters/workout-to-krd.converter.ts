import { workoutSchema } from "../schemas/workout";
import { createKrdValidationError } from "../types/errors";
import { mapZodErrors } from "../validation/map-zod-errors";
import type { KRD } from "../schemas/krd";

type CreateWorkoutKRDOptions = {
  created?: string;
};

/**
 * Creates a valid KRD envelope for a structured workout.
 *
 * Validates unknown input against workoutSchema before wrapping.
 * Designed as a validation boundary for agent-provided data.
 *
 * @param workout - Unknown data to validate and wrap in KRD format
 * @param options - Optional overrides (created timestamp for testability)
 * @returns Valid KRD with type "structured_workout"
 * @throws {KrdValidationError} If workout validation fails
 */
export const createWorkoutKRD = (
  workout: unknown,
  options?: CreateWorkoutKRDOptions
): KRD => {
  const result = workoutSchema.safeParse(workout);

  if (!result.success) {
    const errors = mapZodErrors(result.error.issues);
    throw createKrdValidationError(
      `Invalid workout: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
      errors
    );
  }

  const parsed = result.data;

  return {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: options?.created ?? new Date().toISOString(),
      sport: parsed.sport,
      ...(parsed.subSport && { subSport: parsed.subSport }),
    },
    extensions: {
      structured_workout: parsed,
    },
  };
};
