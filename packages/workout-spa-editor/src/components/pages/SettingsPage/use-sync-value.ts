/**
 * Value rendered on the Settings index "Cross-device sync" row. Reads the live
 * sync engine, so it tracks connect/disconnect and every completed cycle
 * without a second source of truth.
 */

import { useSync } from "../../../contexts/sync-context";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { formatRelativeTime } from "../../../utils/format-relative-time";

export const useSyncValue = (): string => {
  const t = useTranslate("settings");
  const tCommon = useTranslate("common");
  const locale = useActiveLocale();
  const { connected, lastSyncedAt } = useSync();

  if (!connected) return t("sync.notConnected");
  if (lastSyncedAt === null) return t("sync.connectedNotSynced");
  const relative = formatRelativeTime(
    new Date(lastSyncedAt),
    new Date(),
    locale
  );
  return t("values.sync.connected", {
    relative: tCommon(relative.key, relative.params),
  });
};
