import type { KRD } from "../schemas/krd";
import type { Workout } from "../schemas/workout";
import { createKrdValidationError } from "../types/errors";
import { parseWorkoutOrThrow } from "./parse-workout";

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
      "KRD does not contain a structured workout",
      [{ field: "extensions.structured_workout", message: "Required" }]
    );
  }

  return parseWorkoutOrThrow(ext);
};
