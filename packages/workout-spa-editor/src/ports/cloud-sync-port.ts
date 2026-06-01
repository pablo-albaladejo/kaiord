/**
 * Cloud Sync Port
 *
 * Auth + file-I/O contract for the single canonical snapshot file in the
 * user's cloud storage (Google Drive `appDataFolder`). The Google Drive
 * adapter implements this; an in-memory fake mirrors it for use-case
 * tests. This port performs authentication and snapshot read/write ONLY —
 * it contains no merge or conflict-resolution logic. Application use
 * cases depend on this port and never on the Drive REST API or any HTTP
 * client directly.
 */

import type { RemoteSnapshot, Snapshot } from "../types/snapshot";

export type CloudSyncPort = {
  /** True when a usable access token is currently held. */
  isAuthenticated: () => boolean;
  /** Trigger the OAuth consent / silent-token flow. */
  authenticate: () => Promise<void>;
  /** Read the remote snapshot, or `null` when no file exists yet. */
  pull: () => Promise<RemoteSnapshot | null>;
  /**
   * Write the snapshot. `expectedRevision` is the `headRevisionId` the
   * caller last observed (or `null` to create). Resolves to the new
   * `headRevisionId`.
   */
  push: (
    snapshot: Snapshot,
    expectedRevision: string | null
  ) => Promise<string>;
};
