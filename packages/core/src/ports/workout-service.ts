import type { KRD } from "../domain/schemas/krd";

/**
 * Summary of a remote workout (listing view).
 */
export type WorkoutSummary = {
  id: string;
  name: string;
  sport: string;
  created_at: string;
  updated_at: string;
};

/**
 * Result of pushing a workout to a remote service.
 */
export type PushResult = { id: string; name: string; url?: string };

/**
 * Options for listing workouts.
 */
export type ListOptions = { offset?: number; limit?: number };

/**
 * Port for a remote workout service (push/pull/list/delete).
 */
export type WorkoutService = {
  push: (krd: KRD) => Promise<PushResult>;
  pull: (workoutId: string) => Promise<KRD>;
  list: (options?: ListOptions) => Promise<WorkoutSummary[]>;
  remove: (workoutId: string) => Promise<void>;
};
