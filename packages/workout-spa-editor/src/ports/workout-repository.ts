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
  /**
   * Local-repair reconciliation ONLY: drops a row local heuristics classify
   * as junk (`removeUntouchedCoachingTemplates`). Behaviourally identical to
   * `delete`, but deliberately OUTSIDE the `withTombstones` surface — the
   * "is this untouched junk?" verdict reads `modifiedAt` / `createdAt` ===
   * `updatedAt` on the LOCAL row, and a device that has not yet merged the
   * user's edit still sees the pristine template. Tombstoning there would
   * destroy the edited workout on every device, permanently.
   */
  deleteLocalOrphan: (id: string) => Promise<void>;
  deleteByProfile: (profileId: string) => Promise<void>;
};
