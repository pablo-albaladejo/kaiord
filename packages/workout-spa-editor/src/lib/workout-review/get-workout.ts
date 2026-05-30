import { type Workout, workoutSchema } from "@kaiord/core";

import type { KRD } from "../../types/krd";

/** Extract the structured workout from a generated KRD's extensions, or null. */
export function getStructuredWorkout(krd: KRD): Workout | null {
  const result = workoutSchema.safeParse(krd.extensions?.structured_workout);
  return result.success ? result.data : null;
}
