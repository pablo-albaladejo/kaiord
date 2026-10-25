/**
 * Cascades across tables are owned by the application-layer orchestrator
 * (e.g., `deleteProfile` use case), which wraps the cascade-helper calls
 * in one transaction.
 */

import type Dexie from "dexie";
import type { Table } from "dexie";

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import {
  assertSessionMatchDate,
  type SessionMatch,
} from "../../types/session-match";
import type { KaiordDatabase } from "./dexie-database";
import { appendExecutedWorkoutIdsTx } from "./dexie-session-match-append-executed";
import { buildReaders } from "./dexie-session-match-readers";
import { updateCoachingActivityIdTx } from "./dexie-session-match-update";
import { assertNoSessionMatchConflict } from "./session-match-conflict";

const buildWriters = (
  db: KaiordDatabase,
  table: () => Table<SessionMatch>
): Pick<
  SessionMatchRepository,
  | "put"
  | "updateCoachingActivityId"
  | "appendExecutedWorkoutIds"
  | "updateDate"
  | "delete"
  | "deleteLocalOrphan"
  | "deleteByActivityId"
  | "deleteByWorkoutId"
  | "deleteByProfile"
> => ({
  put: async (match) => {
    // Cast to plain Dexie to avoid the deep-instantiation error TS hits when
    // matching `db.transaction` overloads against the typed KaiordDatabase
    // tables tuple — same workaround as in dexie-persistence-adapter.ts.
    const dexie = db as unknown as Dexie;
    await dexie.transaction("rw", "sessionMatches", async () => {
      await assertNoSessionMatchConflict(table(), match);
      await table().put(match);
    });
  },
  updateCoachingActivityId: (id, newCoachingActivityId) =>
    updateCoachingActivityIdTx(db, table, id, newCoachingActivityId),
  appendExecutedWorkoutIds: (id, workoutIds) =>
    appendExecutedWorkoutIdsTx(db, table, id, workoutIds),
  updateDate: async (id, date, updatedAt) => {
    assertSessionMatchDate(date);
    await table().update(id, { date, updatedAt });
  },
  delete: (id) => table().delete(id),
  // Same primitive as `delete`; a distinct name is what keeps the
  // heal/local-repair path off the `withTombstones` surface.
  deleteLocalOrphan: (id) => table().delete(id),
  deleteByActivityId: async (coachingActivityId) => {
    await table()
      .where("coachingActivityId")
      .equals(coachingActivityId)
      .delete();
  },
  deleteByWorkoutId: async (workoutId) => {
    await table().where("workoutId").equals(workoutId).delete();
  },
  deleteByProfile: async (profileId) => {
    await table().where("profileId").equals(profileId).delete();
  },
});

export function createDexieSessionMatchRepository(
  db: KaiordDatabase
): SessionMatchRepository {
  const table = () => db.table<SessionMatch>("sessionMatches");
  return { ...buildReaders(table), ...buildWriters(db, table) };
}
