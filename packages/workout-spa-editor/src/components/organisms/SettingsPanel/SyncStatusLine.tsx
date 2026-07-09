import type { SyncStatus } from "../../../hooks/sync-engine-types";
import {
  getTranslate,
  type Translate,
  useTranslate,
} from "../../../i18n/use-translate";

export type SyncStatusLineProps = {
  connected: boolean;
  status: SyncStatus;
  lastSyncedAt: string | null;
};

function describe(
  props: SyncStatusLineProps,
  t: Translate = getTranslate("settings")
): string {
  if (!props.connected) return t("sync.notConnected");
  if (props.status === "syncing") return t("sync.syncing");
  if (props.status === "error") return t("sync.offline");
  if (props.lastSyncedAt) {
    return t("sync.lastSynced", {
      date: new Date(props.lastSyncedAt).toLocaleString(),
    });
  }
  return t("sync.connectedNotSynced");
}

export const SyncStatusLine: React.FC<SyncStatusLineProps> = (props) => {
  const t = useTranslate("settings");
  return (
    <p
      data-testid="sync-status"
      className="text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {describe(props, t)}
    </p>
  );
};
