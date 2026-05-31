/**
 * Tombstone Delete Decorator
 *
 * Wraps a `PersistencePort` so that every id-keyed `delete(id)` on a
 * snapshot-participating table also records a `[table+id]` tombstone in
 * the same transaction. This is the single chokepoint that guarantees
 * no delete escapes tombstoning — call sites pass no extra argument.
 *
 * Profile-cascade deletes (`deleteByProfile`, session-match cascade
 * hooks) are not decorated here: the cascade removes a whole profile's
 * data on every device independently, so per-row tombstones are
 * unnecessary and would bloat the snapshot.
 */

import type { PersistencePort } from "../ports/persistence-port";

// Repos exposing a single-arg `delete(id)` whose removal must propagate.
const TOMBSTONED_TABLES = [
  "workouts",
  "templates",
  "profiles",
  "aiProviders",
  "coaching",
  "sessionMatch",
] as const;

type TombstonedTable = (typeof TOMBSTONED_TABLES)[number];

type IdDeletable = { delete: (id: string) => Promise<void> };

const decorateRepo = (
  port: PersistencePort,
  table: TombstonedTable,
  repo: IdDeletable
): IdDeletable => ({
  ...repo,
  delete: (id: string) =>
    port.transaction(async () => {
      await repo.delete(id);
      await port.tombstones.put({
        table,
        id,
        deletedAt: new Date().toISOString(),
      });
    }),
});

export function withTombstones(port: PersistencePort): PersistencePort {
  const decorated: Record<string, unknown> = { ...port };
  for (const table of TOMBSTONED_TABLES) {
    const repo = port[table] as unknown as IdDeletable;
    decorated[table] = { ...repo, ...decorateRepo(port, table, repo) };
  }
  return decorated as unknown as PersistencePort;
}
