/**
 * Value rendered on the Settings index "Cross-device sync" row. Reads the live
 * sync engine, so it tracks connect/disconnect and every completed cycle
 * without a second source of truth.
 */

import { useSync } from "../../../contexts/sync-context";
import { useTranslate } from "../../../i18n/use-translate";
import { formatRelativeTime } from "../../../utils/format-relative-time";

export const useSyncValue = (): string => {
  const t = useTranslate("settings");
  const { connected, lastSyncedAt } = useSync();

  if (!connected) return t("sync.notConnected");
  if (lastSyncedAt === null) return t("sync.connectedNotSynced");
  return t("values.sync.connected", {
    relative: formatRelativeTime(new Date(lastSyncedAt), new Date()),
  });
};
