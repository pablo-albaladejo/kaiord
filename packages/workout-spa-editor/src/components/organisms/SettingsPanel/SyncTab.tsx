import { useSync } from "../../../contexts/sync-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { Button } from "../../atoms/Button";
import { EncryptionSection } from "./EncryptionSection";
import { SyncStatusLine } from "./SyncStatusLine";

const CONNECT_FAILED_TOAST = "Could not connect Google account — please retry.";
const SYNC_FAILED_TOAST = "Sync failed — your data is safe and stays local.";
const SYNC_OK_TOAST = "Sync complete.";

export const SyncTab: React.FC = () => {
  const sync = useSync();
  const toast = useToastContext();
  const providers = useAiProvidersLive();
  const hasAiKeys = (providers?.length ?? 0) > 0;

  const handleConnect = async () => {
    try {
      await sync.connect();
    } catch {
      toast.error(CONNECT_FAILED_TOAST);
    }
  };

  const handleSyncNow = async () => {
    const ok = await sync.syncNow();
    if (ok) toast.success(SYNC_OK_TOAST);
    else toast.error(SYNC_FAILED_TOAST);
  };

  return (
    <div className="space-y-4" data-testid="sync-tab">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Sync your workouts and settings across devices through your own Google
        Drive. Data lives on your Drive; no Kaiord server is involved.
      </p>
      <SyncStatusLine
        connected={sync.connected}
        status={sync.status}
        lastSyncedAt={sync.lastSyncedAt}
      />
      <div className="flex flex-wrap gap-2">
        {sync.connected ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={sync.status === "syncing"}
              onClick={handleSyncNow}
            >
              Sync now
            </Button>
            <Button size="sm" variant="tertiary" onClick={sync.disconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button size="sm" variant="primary" onClick={handleConnect}>
            Connect Google account
          </Button>
        )}
      </div>
      <EncryptionSection hasAiKeys={hasAiKeys} />
    </div>
  );
};
