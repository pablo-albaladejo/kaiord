import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useDiscoveredExtensionId } from "../../../hooks/use-discovered-extension-id";
import type { TanitaGarminSyncStatus } from "../../../hooks/use-tanita-garmin-sync";
import { useTanitaGarminSync } from "../../../hooks/use-tanita-garmin-sync";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import type { BridgeState } from "./BridgeStatusRow";
import { BridgeStatusRow } from "./BridgeStatusRow";

const TANITA_BRIDGE_ID = "tanita-bridge";
const GARMIN_BRIDGE_ID = "garmin-bridge";

const IN_FLIGHT: readonly TanitaGarminSyncStatus[] = [
  "reading",
  "parsing",
  "encoding",
  "uploading",
];

const bridgeState = (extensionId: string | null): BridgeState =>
  extensionId ? "connected" : "not-detected";

/**
 * Manual "Sync Tanita → Garmin" body-composition card. Shows discovery status
 * for both bridges, fires the governed export use case via `useTanitaGarminSync`,
 * and surfaces the read → parse → encode → upload state machine. The button is
 * disabled unless both bridges are discovered and a profile is active.
 */
export const TanitaGarminSyncCard: React.FC = () => {
  const t = useTranslate("settings");
  const profileId = useActiveProfileLive()?.id ?? null;
  const { status, lastError, canSync, sync } = useTanitaGarminSync(profileId);
  const tanitaExtensionId = useDiscoveredExtensionId(TANITA_BRIDGE_ID);
  const garminExtensionId = useDiscoveredExtensionId(GARMIN_BRIDGE_ID);

  const inFlight = IN_FLIGHT.includes(status);

  return (
    <section className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("bodyCompositionSync.title")}
      </h3>
      <table className="w-full">
        <tbody>
          <BridgeStatusRow
            name="Tanita"
            state={bridgeState(tanitaExtensionId)}
            hint={t("bodyCompositionSync.tanitaHint")}
          />
          <BridgeStatusRow
            name="Garmin Connect"
            state={bridgeState(garminExtensionId)}
            hint={t("extensions.garminHint")}
          />
        </tbody>
      </table>
      <Button
        size="sm"
        variant="primary"
        loading={inFlight}
        disabled={!canSync}
        onClick={() => void sync()}
      >
        {t("bodyCompositionSync.syncTanitaToGarmin")}
      </Button>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t(`bodyCompositionSync.sync.${status}`)}
      </p>
      {status === "needsReauth" && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500">
          {t("bodyCompositionSync.reauthHint")}
        </p>
      )}
      {status === "error" && lastError && (
        <p className="text-xs text-red-600 dark:text-red-400">{lastError}</p>
      )}
    </section>
  );
};
