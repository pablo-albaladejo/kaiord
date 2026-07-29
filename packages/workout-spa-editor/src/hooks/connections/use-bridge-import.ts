/**
 * useBridgeImport — the Connections page's per-source "Sync now".
 *
 * Both guards live in `import-cooldown`, not in this hook's state: nothing
 * downstream provides backpressure (imports do not queue behind
 * `BRIDGE_QUEUE`, and Tanita's downloads a whole export CSV per call), and
 * hook state dies with the Manage panel that renders the button. Reading the
 * in-flight map synchronously also settles the two-fast-clicks case that a
 * captured `status` could not.
 */
import { useCallback, useState } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { usePersistence } from "../../contexts/persistence-context";
import { bridgeImporterFor } from "../bridge-import/bridge-importers";
import {
  isCoolingDown,
  isImportRunning,
  startOrJoinImport,
} from "./import-cooldown";

export type BridgeImportStatus =
  "idle" | "running" | "done" | "failed" | "cooldown";

export type BridgeImport = {
  readonly supported: boolean;
  readonly status: BridgeImportStatus;
  readonly run: () => void;
};

export const useBridgeImport = (
  bridgeId: string | null,
  profileId: string | null
): BridgeImport => {
  const persistence = usePersistence();
  const [status, setStatus] = useState<BridgeImportStatus>("idle");
  const importer = bridgeImporterFor(bridgeId);

  const run = useCallback(() => {
    if (importer === undefined || bridgeId === null || profileId === null) {
      return;
    }
    // Joining an in-flight pull rather than refusing it: a card remounted
    // mid-pull adopts the running state and settles with the real outcome.
    if (!isImportRunning(bridgeId) && isCoolingDown(bridgeId, Date.now())) {
      setStatus("cooldown");
      return;
    }
    const extensionId = bridgeDiscovery.getExtensionId(bridgeId);
    if (extensionId === null) {
      setStatus("failed");
      return;
    }
    setStatus("running");
    void startOrJoinImport(bridgeId, () =>
      importer(persistence, extensionId, profileId)
    ).then(
      () => setStatus("done"),
      () => setStatus("failed")
    );
  }, [importer, bridgeId, profileId, persistence]);

  return { supported: importer !== undefined, status, run };
};
