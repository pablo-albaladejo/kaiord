/**
 * Single-purpose `rw` transaction that rewrites the
 * `coachingActivityId` of an existing `sessionMatches` row.
 *
 * Used by `healSessionMatchIdShape` to migrate legacy SHORT-form rows
 * to the canonical COMPOSITE shape without churning the primary key.
 * Re-runs `assertNoSessionMatchConflict` against the proposed row so a
 * conflicting compound-unique slot still throws
 * `SessionAlreadyMatchedError`.
 */

import type Dexie from "dexie";
import type { Table } from "dexie";

import type { SessionMatch } from "../../types/session-match";
import type { KaiordDatabase } from "./dexie-database";
import { assertNoSessionMatchConflict } from "./session-match-conflict";

export const updateCoachingActivityIdTx = async (
  db: KaiordDatabase,
  table: () => Table<SessionMatch>,
  id: string,
  newCoachingActivityId: string
): Promise<void> => {
  // Cast to plain Dexie to avoid the deep-instantiation error TS hits
  // when matching `db.transaction` overloads against the typed
  // KaiordDatabase tables tuple — same workaround as in
  // dexie-persistence-adapter.ts.
  const dexie = db as unknown as Dexie;
  await dexie.transaction("rw", "sessionMatches", async () => {
    const existing = await table().get(id);
    if (!existing) return;
    const next: SessionMatch = {
      ...existing,
      coachingActivityId: newCoachingActivityId,
    };
    await assertNoSessionMatchConflict(table(), next);
    await table().put(next);
  });
};
