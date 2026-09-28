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
 * Options for pushing a workout. `ftpWatts` resolves `percent_ftp` power
 * targets for services that store absolute watts.
 */
export type PushOptions = { ftpWatts?: number };

/**
 * Options for listing workouts.
 */
export type ListOptions = { offset?: number; limit?: number };

/**
 * Port for a remote workout service (push/pull/list/delete).
 */
export type WorkoutService = {
  push: (krd: KRD, options?: PushOptions) => Promise<PushResult>;
  pull: (workoutId: string) => Promise<KRD>;
  list: (options?: ListOptions) => Promise<WorkoutSummary[]>;
  remove: (workoutId: string) => Promise<void>;
};
