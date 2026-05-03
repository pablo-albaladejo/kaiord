import { useCallback, useEffect } from "react";

import { useGarminBridge } from "../../../contexts";
import { useTrain2GoStore } from "../../../store/train2go-store";
import { Button } from "../../atoms/Button";
import type { BridgeState } from "./BridgeStatusRow";
import { BridgeStatusRow } from "./BridgeStatusRow";

function toBridgeState(installed: boolean, session: boolean): BridgeState {
  if (!installed) return "not-detected";
  return session ? "connected" : "no-session";
}

export const ExtensionsTab: React.FC = () => {
  const garmin = useGarminBridge();
  const train2go = useTrain2GoStore();
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
              Bridge
            </th>
            <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status
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
            hint="Open Garmin Connect and navigate around"
          />
          <BridgeStatusRow
            name="Train2Go"
            state={toBridgeState(
              train2go.extensionInstalled,
              train2go.sessionActive
            )}
            hint="Open Train2Go and log in"
          />
        </tbody>
      </table>
      <Button size="sm" variant="secondary" onClick={refreshAll}>
        Refresh Status
      </Button>
    </div>
  );
};
