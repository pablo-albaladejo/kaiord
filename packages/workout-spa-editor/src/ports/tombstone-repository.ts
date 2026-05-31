/**
 * Tombstone Repository Port
 *
 * Records delete markers (`[table+id]`) so deletions propagate across
 * devices during cloud sync. Writes flow through the `withTombstones`
 * decorator at a single chokepoint; this port exposes the read/list/
 * prune surface the snapshot use cases and merge engine need.
 */

import type { Tombstone } from "../types/snapshot";

export type TombstoneRepository = {
  /** Idempotent upsert keyed on `[table+id]`. */
  put: (tombstone: Tombstone) => Promise<void>;
  /** Single tombstone by composite key, or undefined when absent. */
  get: (table: string, id: string) => Promise<Tombstone | undefined>;
  /** Every tombstone, unordered. */
  list: () => Promise<Tombstone[]>;
  /** Drop tombstones whose `deletedAt` is strictly older than `before`. */
  prune: (before: string) => Promise<void>;
};
