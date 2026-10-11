/**
 * Shared types and constants for the cross-device sync engine UI layer.
 * Split out so `useSyncEngine` and the sync context/components can import
 * the contract without pulling in React state internals.
 */

import type { ProfileChoice } from "../application/sync/reconcile-auto-profile";

/** Auto-push debounce window: collapse a burst of edits into one push. */
export const PUSH_DEBOUNCE_MS = 5000;

export type SyncStatus = "idle" | "syncing" | "error";

/** How a sync cycle ended; `needsChoice` pushed nothing and is not an error. */
export type SyncOutcome = "synced" | "needsChoice" | "failed";

export type SyncEngine = {
  status: SyncStatus;
  /** ISO timestamp of the last successful sync, or null. */
  lastSyncedAt: string | null;
  /** Last error message, or null when the last sync succeeded. */
  error: string | null;
  /** True once a Google account is connected for sync. */
  connected: boolean;
  /** Run a full pull-merge-push cycle now. */
  syncNow: () => Promise<SyncOutcome>;
  /** Schedule a debounced push after edits settle. */
  requestPush: () => void;
  /** Run the OAuth consent flow and enable sync. */
  connect: () => Promise<void>;
  /** Stop sync triggers without deleting local data. */
  disconnect: () => void;
  /**
   * Remote profiles to pick from when the cloud holds several real ones and
   * this device still has its unclaimed default profile; null otherwise.
   * Sync pushes nothing until one is chosen.
   */
  profileChoice: ProfileChoice[] | null;
  /** Store the chosen remote profile, then re-run the sync cycle. */
  chooseProfile: (profileId: string) => Promise<SyncOutcome>;
};
