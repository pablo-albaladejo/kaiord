/**
 * Shared types and constants for the cross-device sync engine UI layer.
 * Split out so `useSyncEngine` and the sync context/components can import
 * the contract without pulling in React state internals.
 */

/** Auto-push debounce window: collapse a burst of edits into one push. */
export const PUSH_DEBOUNCE_MS = 5000;

export type SyncStatus = "idle" | "syncing" | "error";

export type SyncEngine = {
  status: SyncStatus;
  /** ISO timestamp of the last successful sync, or null. */
  lastSyncedAt: string | null;
  /** Last error message, or null when the last sync succeeded. */
  error: string | null;
  /** True once a Google account is connected for sync. */
  connected: boolean;
  /** Run a full pull-merge-push cycle now; resolves true on success. */
  syncNow: () => Promise<boolean>;
  /** Schedule a debounced push after edits settle. */
  requestPush: () => void;
  /** Run the OAuth consent flow and enable sync. */
  connect: () => Promise<void>;
  /** Stop sync triggers without deleting local data. */
  disconnect: () => void;
};
