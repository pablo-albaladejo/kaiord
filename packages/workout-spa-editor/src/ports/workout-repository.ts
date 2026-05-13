/**
 * Workout Repository Port
 *
 * Hexagonal port for workout persistence. As of Dexie v13 workouts are
 * profile-scoped 1–1; `deleteByProfile` is the cascade entry point.
 */

import type { WorkoutState } from "../types/calendar-enums";
import type { WorkoutRecord } from "../types/calendar-schemas";

export type WorkoutRepository = {
  getById: (id: string) => Promise<WorkoutRecord | undefined>;
  getByDateRange: (start: string, end: string) => Promise<WorkoutRecord[]>;
  getByState: (state: WorkoutState) => Promise<WorkoutRecord[]>;
  getBySourceId: (
    source: string,
    sourceId: string
  ) => Promise<WorkoutRecord | undefined>;
  put: (workout: WorkoutRecord) => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteByProfile: (profileId: string) => Promise<void>;
};
