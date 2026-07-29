/**
 * useBridgeImport — the Connections page's per-source "Sync now".
 *
 * Two guards, both client-side, because nothing downstream provides
 * backpressure: bridge imports do not queue behind `BRIDGE_QUEUE`, and one of
 * them (Tanita) downloads a whole export CSV per call. `running` blocks
 * re-entry while a pull is in flight; the cooldown, kept per bridge for the
 * session rather than per mounted card, blocks a second pull for a minute
 * after one finishes.
 */
import { useCallback, useState } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { usePersistence } from "../../contexts/persistence-context";
import { bridgeImporterFor } from "../bridge-import/bridge-importers";
import { isCoolingDown, markImported } from "./import-cooldown";

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
    if (status === "running") return;
    if (isCoolingDown(bridgeId, Date.now())) {
      setStatus("cooldown");
      return;
    }
    const extensionId = bridgeDiscovery.getExtensionId(bridgeId);
    if (extensionId === null) {
      setStatus("failed");
      return;
    }
    setStatus("running");
    const settle = (next: BridgeImportStatus) => () => {
      markImported(bridgeId, Date.now());
      setStatus(next);
    };
    void importer(persistence, extensionId, profileId).then(
      settle("done"),
      settle("failed")
    );
  }, [importer, bridgeId, profileId, persistence, status]);

  return { supported: importer !== undefined, status, run };
};
