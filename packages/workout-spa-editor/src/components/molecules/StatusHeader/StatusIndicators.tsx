import { useGarminBridge } from "../../../contexts/garmin-bridge-context";
import { useTrain2GoZonesSync } from "../../../contexts/train2go-zones-sync-context";
import { useTrain2GoStore } from "../../../store/train2go-store";

const garminLabel = (sessionActive: boolean) =>
  sessionActive ? "Connected" : "Offline";

const garminTone = (sessionActive: boolean) =>
  sessionActive ? "text-green-600 dark:text-green-400" : "text-gray-500";

export function StatusIndicators() {
  const garmin = useGarminBridge();
  const sync = useTrain2GoZonesSync();
  const train2goInstalled = useTrain2GoStore((s) => s.extensionInstalled);

  const syncLabel = sync.pending ? "Conflict" : "Synced";
  const syncTone = sync.pending
    ? "text-amber-600 dark:text-amber-400"
    : "text-gray-500";

  return (
    <>
      {garmin.extensionInstalled && (
        <span
          className={garminTone(garmin.sessionActive)}
          data-testid="status-header-garmin"
        >
          Garmin: {garminLabel(garmin.sessionActive)}
        </span>
      )}
      {train2goInstalled && (
        <span className={syncTone} data-testid="status-header-sync">
          Train2Go: {syncLabel}
        </span>
      )}
    </>
  );
}
