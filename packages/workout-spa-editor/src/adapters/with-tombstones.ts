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
 *    hooks), the nutrition stores' included. The profile row IS tombstoned
 *    (via `profiles`), and the sync and the backup drop every per-profile
 *    row of a tombstoned profile (`dropDeletedProfileRows`), so a profile
 *    delete needs one tombstone, not a per-row tombstone storm. Per-row
 *    tombstones would also cover less: a device that never saw the delete
 *    can edit or add a row of that profile later, and that row's clock
 *    beats any per-row tombstone, while the drop goes by `profileId`.
 *
 * A tombstone's id is the row's single-field primary key: `id`, or
 * `profileId` for `energyTargets` (one goal per profile). Model bindings are
 * the one composite-key table decorated: `delete(profileId, purpose)` is a
 * user choice ("Same as main model", or removing the provider), so its
 * tombstone id is `<profileId>:<purpose>` (`tombstoneIdOf`).
 */

import { tombstoneIdOf } from "../application/sync/merge-record-key";
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
  intakeEntries: "intakeEntries",
  intakePresets: "intakePresets",
  // Keyed by `profileId`: the tombstone id is the goal's profile id.
  energyTargets: "energyTargets",
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

const decorateBindings = (
  port: PersistencePort
): PersistencePort["aiModelBindings"] => {
  const repo = port.aiModelBindings;
  return {
    ...repo,
    delete: (profileId, purpose) =>
      port.transaction(async () => {
        const existed = (await repo.get(profileId, purpose)) !== undefined;
        await repo.delete(profileId, purpose);
        const id = tombstoneIdOf("aiModelBindings", { profileId, purpose });
        if (!existed || id === undefined) return;
        await port.tombstones.put({
          table: "aiModelBindings",
          id,
          deletedAt: new Date().toISOString(),
          profileId,
        });
      }),
  };
};

export function withTombstones(port: PersistencePort): PersistencePort {
  const decorated: Record<string, unknown> = {
    ...port,
    aiModelBindings: decorateBindings(port),
  };
  for (const [key, snapshotTable] of Object.entries(TOMBSTONED_TABLES)) {
    const repo = port[key as TombstonedRepoKey] as unknown as IdDeletable;
    decorated[key] = decorateRepo(port, snapshotTable, repo);
  }
  return decorated as unknown as PersistencePort;
}
