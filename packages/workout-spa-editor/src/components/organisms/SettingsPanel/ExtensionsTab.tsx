import { useCallback, useEffect } from "react";

import { useGarminBridge } from "../../../contexts";
import { useDiscoveredExtensionId } from "../../../hooks/use-discovered-extension-id";
import { useTranslate } from "../../../i18n/use-translate";
import { useTrain2GoStore } from "../../../store/train2go-store";
import { Button } from "../../atoms/Button";
import type { BridgeState } from "./BridgeStatusRow";
import { BridgeStatusRow } from "./BridgeStatusRow";
import { TanitaGarminSyncCard } from "./TanitaGarminSyncCard";

const TANITA_BRIDGE_ID = "tanita-bridge";

function toBridgeState(installed: boolean, session: boolean): BridgeState {
  if (!installed) return "not-detected";
  return session ? "connected" : "no-session";
}

export const ExtensionsTab: React.FC = () => {
  const t = useTranslate("settings");
  const garmin = useGarminBridge();
  const train2go = useTrain2GoStore();
  const tanitaExtensionId = useDiscoveredExtensionId(TANITA_BRIDGE_ID);
  // Destructure stable method refs so the effect/callback dep arrays
  // reference the methods directly — exhaustive-deps is satisfied
  // without disabling the rule.
  const { detectExtension: detectGarmin } = garmin;
  const { detectExtension: detectTrain2go } = train2go;

  useEffect(() => {
    detectGarmin();
    detectTrain2go();
  }, [detectGarmin, detectTrain2go]);

  const refreshAll = useCallback(() => {
    detectGarmin();
    detectTrain2go();
  }, [detectGarmin, detectTrain2go]);

  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("extensions.bridge")}
            </th>
            <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("extensions.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          <BridgeStatusRow
            name="Garmin Connect"
            state={toBridgeState(
              garmin.extensionInstalled,
              garmin.sessionActive
            )}
            hint={t("extensions.garminHint")}
          />
          <BridgeStatusRow
            name="Train2Go"
            state={toBridgeState(
              train2go.extensionInstalled,
              train2go.sessionActive
            )}
            hint={t("extensions.train2goHint")}
          />
          <BridgeStatusRow
            name="Tanita"
            state={tanitaExtensionId ? "connected" : "not-detected"}
            hint={t("bodyCompositionSync.tanitaHint")}
          />
        </tbody>
      </table>
      <Button size="sm" variant="secondary" onClick={refreshAll}>
        {t("extensions.refreshStatus")}
      </Button>
      <TanitaGarminSyncCard />
    </div>
  );
};
