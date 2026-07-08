import { useGarminBridge } from "../../../contexts/garmin-bridge-context";
import { useTrain2GoZonesSync } from "../../../contexts/train2go-zones-sync-context";
import { useTranslate } from "../../../i18n/use-translate";
import { useTrain2GoStore } from "../../../store/train2go-store";

const garminTone = (sessionActive: boolean) =>
  sessionActive ? "text-green-600 dark:text-green-400" : "text-gray-500";

export function StatusIndicators() {
  const t = useTranslate("common");
  const garmin = useGarminBridge();
  const sync = useTrain2GoZonesSync();
  const train2goInstalled = useTrain2GoStore((s) => s.extensionInstalled);

  const garminLabel = t(
    garmin.sessionActive ? "status.connected" : "status.offline"
  );
  const syncLabel = t(sync.pending ? "status.conflict" : "status.synced");
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
          {t("bridge.garmin", { label: garminLabel })}
        </span>
      )}
      {train2goInstalled && (
        <span className={syncTone} data-testid="status-header-sync">
          {t("bridge.train2go", { label: syncLabel })}
        </span>
      )}
    </>
  );
}
