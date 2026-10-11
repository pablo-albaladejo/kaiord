import { useCallback } from "react";

import { exportBackup } from "../../../application/backup/export-backup";
import { usePersistence } from "../../../contexts/persistence-context";
import { useSnapshotSource } from "../../../contexts/sync-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { triggerDownload } from "../../../utils/save-workout.helpers";

const backupFilename = (now: Date): string =>
  `kaiord-backup-${now.toISOString().slice(0, 10)}.json`;

/** Downloads the whole local database as a `kaiord-backup` JSON file. */
export function useExportBackup(): () => Promise<void> {
  const t = useTranslate("settings");
  const persistence = usePersistence();
  const { snapshotPort, deviceId } = useSnapshotSource();
  const toast = useToastContext();

  return useCallback(async () => {
    try {
      const backup = await exportBackup({
        port: snapshotPort,
        nutrition: persistence,
        deviceId,
      });
      triggerDownload(JSON.stringify(backup), backupFilename(new Date()));
    } catch {
      toast.error(t("privacy.exportFailed"));
    }
  }, [snapshotPort, persistence, deviceId, toast, t]);
}
