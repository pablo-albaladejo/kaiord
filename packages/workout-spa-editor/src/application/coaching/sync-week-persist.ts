/**
 * Persistence tail of `syncWeek`. Stamps provenance on every fetched row,
 * upserts, moves the converted workouts the coach moved (follow the coach),
 * deletes coach-removed orphans within the window, and bumps the staleness
 * gate unconditionally. Returns the orphans deleted and the coach moves.
 */
import type {
  CoachingRepository,
  CoachingSyncStateRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { stampProvenance } from "../import/stamp-provenance";
import {
  applyCoachDateMoves,
  type CoachDateMoves,
} from "./apply-coach-date-moves";

export type PersistSyncedWeekDeps = {
  coaching: CoachingRepository;
  coachingSyncState: CoachingSyncStateRepository;
  workouts: WorkoutRepository;
  now?: () => string;
};

export type PersistedWeek = CoachDateMoves & { orphansDeleted: number };

export type PersistSyncedWeekInput = {
  profileId: string;
  source: string;
  fetched: CoachingActivityRecord[];
  localSameSource: CoachingActivityRecord[];
};

export const persistSyncedWeek = async (
  deps: PersistSyncedWeekDeps,
  input: PersistSyncedWeekInput
): Promise<PersistedWeek> => {
  const now = deps.now ?? (() => new Date().toISOString());
  const bridgeId = `${input.source}-bridge`;
  const stamped = input.fetched.map((r) => ({
    ...r,
    ...stampProvenance(bridgeId, r.sourceId),
  }));
  await deps.coaching.upsertMany(stamped);
  const moves = await applyCoachDateMoves(
    { workouts: deps.workouts, now },
    input.fetched,
    input.localSameSource
  );

  const fetchedIds = new Set(stamped.map((r) => r.id));
  const orphans = input.localSameSource.filter((r) => !fetchedIds.has(r.id));
  // `deleteMirrorOrphan`, never `delete`: this re-mirrors the bridge's view of
  // the week, it does not express user intent. A short/empty/failed upstream
  // week must not write a cross-device tombstone over a real activity.
  for (const orphan of orphans)
    await deps.coaching.deleteMirrorOrphan(orphan.id);

  await deps.coachingSyncState.put({
    source: input.source,
    profileId: input.profileId,
    lastSyncedAt: now(),
  });
  return { ...moves, orphansDeleted: orphans.length };
};
