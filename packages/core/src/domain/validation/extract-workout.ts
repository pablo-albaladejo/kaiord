import { mapZodErrors } from "./map-zod-errors";
import { workoutSchema } from "../schemas/workout";
import { createKrdValidationError } from "../types/errors";
import type { KRD } from "../schemas/krd";
import type { Workout } from "../schemas/workout";

/**
 * Extracts and validates the structured workout from a KRD object.
 *
 * Checks that the KRD type is "structured_workout" and validates
 * the workout in extensions.structured_workout against workoutSchema.
 *
 * @param krd - KRD object to extract workout from
 * @returns Validated Workout object
 * @throws {KrdValidationError} If KRD is not a structured workout or workout is invalid
 */
export const extractWorkout = (krd: KRD): Workout => {
  if (krd.type !== "structured_workout") {
    throw createKrdValidationError(
      `Expected type "structured_workout", got "${krd.type}"`,
      [{ field: "type", message: `Expected "structured_workout"` }]
    );
  }

  const ext = krd.extensions?.structured_workout;

  if (!ext || typeof ext !== "object" || Array.isArray(ext)) {
    throw createKrdValidationError(
      "Missing or invalid extensions.structured_workout",
      [{ field: "extensions.structured_workout", message: "Required" }]
    );
  }

  const result = workoutSchema.safeParse(ext);

  if (!result.success) {
    const errors = mapZodErrors(result.error.issues);
    throw createKrdValidationError(
      `Invalid workout: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
      errors
    );
  }

  return result.data;
};
