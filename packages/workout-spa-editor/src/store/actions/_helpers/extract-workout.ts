/**
 * Extracts the structured-workout payload from a KRD document, or
 * returns `null` when the document is absent or not structured (no
 * `extensions.structured_workout`). Centralizes the early-return guard
 * shared by every repetition-block / step mutation action — they all
 * must no-op on non-structured input — and the read-side projections
 * (history, hydrate, back-handler) that previously cast inline. Accepts
 * `null`/`undefined` so optional-chained read sites can route through it
 * without a bespoke guard.
 */

import type { KRD, Workout } from "../../../types/krd";

export const extractStructuredWorkout = (
  krd: KRD | null | undefined
): Workout | null => {
  if (!krd?.extensions?.structured_workout) {
    return null;
  }
  return krd.extensions.structured_workout as Workout;
};
