/**
 * Stub repository builders used by `convertCoachingActivityWithAi`
 * tests. Split from the main test-helpers file to keep both under the
 * per-file line cap.
 */
import type {
  CoachingRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";

export const buildStubCoachingRepo = (
  rows: CoachingActivityRecord[]
): CoachingRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getById: async (id) => map.get(id),
    getByProfileAndDateRange: async () => [...map.values()],
    getByProfileAndSourceId: async () => undefined,
    upsertMany: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
    deleteByProfile: async () => undefined,
  };
};

export type StubWorkoutRepo = WorkoutRepository & {
  setSourceLookup: (w: WorkoutRecord | undefined) => void;
};

const deleteFromStore = (
  store: Map<string, WorkoutRecord>,
  pid: string
): void => {
  for (const [k, w] of store) if (w.profileId === pid) store.delete(k);
};

export const buildStubWorkoutRepo = (
  rows: WorkoutRecord[] = []
): StubWorkoutRepo => {
  const store = new Map(rows.map((r) => [r.id, r]));
  let next: WorkoutRecord | undefined;
  return {
    getById: async (id) => store.get(id),
    getByDateRange: async () => [...store.values()],
    getByState: async () => [],
    getBySourceId: async () => next,
    put: async (w) => void store.set(w.id, w),
    delete: async (id) => void store.delete(id),
    deleteByProfile: async (pid) => deleteFromStore(store, pid),
    setSourceLookup: (w) => {
      next = w;
    },
  };
};
