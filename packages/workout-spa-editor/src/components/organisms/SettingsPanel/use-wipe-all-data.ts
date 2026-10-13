import { useCallback } from "react";

import { wipeAllData } from "../../../application/backup/wipe-all-data";
import { useSnapshotSource, useSync } from "../../../contexts/sync-context";
import { clearDeviceStorage, reloadToFirstRun } from "../../../lib/wipe-device";

/** Deletes everything in this browser, then starts the app from scratch. */
export function useWipeAllData(): () => Promise<void> {
  const { snapshotPort } = useSnapshotSource();
  const { disconnect } = useSync();

  return useCallback(async () => {
    await wipeAllData({
      snapshotPort,
      stopSync: disconnect,
      clearDeviceStorage,
    });
    reloadToFirstRun();
  }, [snapshotPort, disconnect]);
}
