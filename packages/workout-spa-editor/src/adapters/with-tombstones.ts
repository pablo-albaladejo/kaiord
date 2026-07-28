/**
 * Tombstone Delete Decorator
 *
 * Wraps a `PersistencePort` so that every id-keyed `delete(id)` on a
 * snapshot-participating table also records a `[table+id]` tombstone in
 * the same transaction. This is the single chokepoint that guarantees no
 * delete expressing USER INTENT escapes tombstoning — call sites pass no
 * extra argument.
 *
 * Two classes of delete are deliberately left undecorated:
 *
 * 1. Reconciliation deletes, which re-mirror an upstream source or repair
 *    local state instead of expressing user intent. Whether such a row is
 *    "an orphan" depends on local state that may differ per device, so a
 *    tombstone could destroy a live row elsewhere, permanently. Those call
 *    sites use dedicated repository methods (`deleteMirrorOrphan`,
 *    `deleteLocalOrphan`) that this decorator does not touch.
 * 2. Profile-cascade deletes (`deleteByProfile`, session-match cascade
 *    hooks). Nothing re-runs that cascade on the other devices — the merge
 *    has no profile-cascade — so after a profile delete the profile row
 *    stays deleted (it IS tombstoned, via `profiles`) while its per-profile
 *    rows come back from the remote as orphans of a dead profile. Closing
 *    that gap needs a profile-aware merge, not a per-row tombstone storm.
 */

import type { PersistencePort } from "../ports/persistence-port";

/**
 * Port repo key → snapshot table name. The two differ for `coaching` and
 * `sessionMatch`, and the tombstone MUST carry the SNAPSHOT name:
 * `mergeSnapshots` suppresses a row by `[snapshotTable+id]`, so a tombstone
 * filed under the port key would never match any row.
 */
export const TOMBSTONED_TABLES = {
  workouts: "workouts",
  templates: "templates",
  profiles: "profiles",
  aiProviders: "aiProviders",
  coaching: "coachingActivities",
  sessionMatch: "sessionMatches",
  // Retention prune deletes old usage events by id; the tombstone suppresses
  // them in merge so a dormant device cannot resurrect them (see D5).
  usageEvents: "usageEvents",
} as const;

type TombstonedRepoKey = keyof typeof TOMBSTONED_TABLES;

type IdDeletable = {
  delete: (id: string) => Promise<void>;
  getById: (id: string) => Promise<unknown>;
};

const decorateRepo = (
  port: PersistencePort,
  snapshotTable: string,
  repo: IdDeletable
): IdDeletable => ({
  ...repo,
  delete: (id: string) =>
    port.transaction(async () => {
      // Only tombstone a delete that actually removed a row; tombstoning a
      // no-op delete could wrongly suppress a record another device still has.
      const existed = (await repo.getById(id)) !== undefined;
      await repo.delete(id);
      if (!existed) return;
      await port.tombstones.put({
        table: snapshotTable,
        id,
        deletedAt: new Date().toISOString(),
      });
    }),
});

export function withTombstones(port: PersistencePort): PersistencePort {
  const decorated: Record<string, unknown> = { ...port };
  for (const [key, snapshotTable] of Object.entries(TOMBSTONED_TABLES)) {
    const repo = port[key as TombstonedRepoKey] as unknown as IdDeletable;
    decorated[key] = decorateRepo(port, snapshotTable, repo);
  }
  return decorated as unknown as PersistencePort;
}
