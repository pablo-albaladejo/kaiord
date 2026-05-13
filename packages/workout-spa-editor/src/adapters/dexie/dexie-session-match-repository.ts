/**
 * Cascades across tables are owned by the application-layer orchestrator
 * (e.g., `deleteProfile` use case), which wraps the cascade-helper calls
 * in one transaction.
 */

import type Dexie from "dexie";
import type { Table } from "dexie";

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { SessionMatch } from "../../types/session-match";
import type { KaiordDatabase } from "./dexie-database";
import { appendExecutedWorkoutIdsTx } from "./dexie-session-match-append-executed";
import { updateCoachingActivityIdTx } from "./dexie-session-match-update";
import { assertNoSessionMatchConflict } from "./session-match-conflict";

const buildReaders = (
  table: () => Table<SessionMatch>
): Pick<
  SessionMatchRepository,
  "getById" | "getByActivityId" | "getByWorkoutId" | "listByProfileAndWeek"
> => ({
  getById: async (id) => (await table().get(id)) ?? undefined,
  getByActivityId: async (profileId, coachingActivityId) =>
    (await table()
      .where("[profileId+coachingActivityId]")
      .equals([profileId, coachingActivityId])
      .first()) ?? undefined,
  getByWorkoutId: async (profileId, workoutId) =>
    (await table()
      .where("[profileId+workoutId]")
      .equals([profileId, workoutId])
      .first()) ?? undefined,
  listByProfileAndWeek: async (profileId, weekStart, weekEnd) =>
    table()
      .where("[profileId+date]")
      .between([profileId, weekStart], [profileId, weekEnd], true, true)
      .toArray(),
});

const buildWriters = (
  db: KaiordDatabase,
  table: () => Table<SessionMatch>
): Pick<
  SessionMatchRepository,
  | "put"
  | "updateCoachingActivityId"
  | "appendExecutedWorkoutIds"
  | "delete"
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
  delete: async (id) => {
    await table().delete(id);
  },
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
