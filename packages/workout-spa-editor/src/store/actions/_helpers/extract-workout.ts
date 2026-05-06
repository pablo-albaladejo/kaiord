/**
 * Extracts the structured-workout payload from a KRD document, or
 * returns `null` when the document is not structured (no
 * `extensions.structured_workout`). Centralizes the early-return guard
 * shared by every repetition-block / step mutation action — they all
 * must no-op on non-structured input.
 */

import type { KRD, Workout } from "../../../types/krd";

export const extractStructuredWorkout = (krd: KRD): Workout | null => {
  if (!krd.extensions?.structured_workout) {
    return null;
  }
  return krd.extensions.structured_workout as Workout;
};
