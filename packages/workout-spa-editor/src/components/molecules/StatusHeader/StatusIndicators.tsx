import { useGarminBridge } from "../../../contexts/garmin-bridge-context";
import { useTrain2GoZonesSync } from "../../../contexts/train2go-zones-sync-context";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";

const garminLabel = (extensionInstalled: boolean, sessionActive: boolean) => {
  if (sessionActive) return "Connected";
  if (extensionInstalled) return "Detected";
  return "Offline";
};

const garminTone = (sessionActive: boolean) =>
  sessionActive ? "text-green-600 dark:text-green-400" : "text-gray-500";

export function StatusIndicators() {
  const activeProfile = useActiveProfileLive()?.profile ?? null;
  const garmin = useGarminBridge();
  const sync = useTrain2GoZonesSync();

  const syncLabel = sync.pending ? "Conflict" : "Synced";
  const syncTone = sync.pending
    ? "text-amber-600 dark:text-amber-400"
    : "text-gray-500";

  return (
    <>
      <span
        className="font-medium text-gray-900 dark:text-white"
        data-testid="status-header-profile"
      >
        {activeProfile?.name ?? "No profile"}
      </span>
      <span
        className={garminTone(garmin.sessionActive)}
        data-testid="status-header-garmin"
      >
        Garmin: {garminLabel(garmin.extensionInstalled, garmin.sessionActive)}
      </span>
      <span className={syncTone} data-testid="status-header-sync">
        Sync: {syncLabel}
      </span>
    </>
  );
}
