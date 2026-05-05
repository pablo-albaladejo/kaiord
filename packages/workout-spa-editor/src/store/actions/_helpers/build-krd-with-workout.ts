/**
 * Re-wraps a mutated structured Workout back into its parent KRD,
 * preserving every other extension. Centralizes the spread-into-
 * extensions pattern shared by all repetition-block / step mutation
 * actions.
 */

import type { KRD, Workout } from "../../../types/krd";

export const buildKrdWithWorkout = (krd: KRD, workout: Workout): KRD => ({
  ...krd,
  extensions: {
    ...krd.extensions,
    structured_workout: workout,
  },
});
