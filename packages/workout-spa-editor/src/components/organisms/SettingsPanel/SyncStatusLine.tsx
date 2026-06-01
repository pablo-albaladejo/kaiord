import type { SyncStatus } from "../../../hooks/sync-engine-types";

export type SyncStatusLineProps = {
  connected: boolean;
  status: SyncStatus;
  lastSyncedAt: string | null;
};

function describe(props: SyncStatusLineProps): string {
  if (!props.connected) return "Not connected";
  if (props.status === "syncing") return "Syncing…";
  if (props.status === "error") return "Last sync failed — working offline";
  if (props.lastSyncedAt) {
    return `Last synced ${new Date(props.lastSyncedAt).toLocaleString()}`;
  }
  return "Connected — not synced yet";
}

export const SyncStatusLine: React.FC<SyncStatusLineProps> = (props) => (
  <p
    data-testid="sync-status"
    className="text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    {describe(props)}
  </p>
);
