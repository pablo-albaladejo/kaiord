/**
 * useBridgeImport — the Connections page's per-source "Sync now".
 *
 * Two guards, both client-side, because nothing downstream provides
 * backpressure: bridge imports do not queue behind `BRIDGE_QUEUE`, and one of
 * them (Tanita) downloads a whole export CSV per call. `running` blocks
 * re-entry while a pull is in flight; the cooldown blocks a second pull for a
 * minute after one finishes, so holding the button cannot hammer the
 * extension.
 */
import { useCallback, useRef, useState } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { usePersistence } from "../../contexts/persistence-context";
import { bridgeImporterFor } from "../bridge-import/bridge-importers";

export const IMPORT_COOLDOWN_MS = 60_000;

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
  const lastRunAt = useRef<number | null>(null);
  const importer = bridgeImporterFor(bridgeId);

  const run = useCallback(() => {
    if (importer === undefined || bridgeId === null || profileId === null) {
      return;
    }
    if (status === "running") return;
    const last = lastRunAt.current;
    if (last !== null && Date.now() - last < IMPORT_COOLDOWN_MS) {
      setStatus("cooldown");
      return;
    }
    const extensionId = bridgeDiscovery.getExtensionId(bridgeId);
    if (extensionId === null) {
      setStatus("failed");
      return;
    }
    setStatus("running");
    void importer(persistence, extensionId, profileId).then(
      () => {
        lastRunAt.current = Date.now();
        setStatus("done");
      },
      () => {
        lastRunAt.current = Date.now();
        setStatus("failed");
      }
    );
  }, [importer, bridgeId, profileId, persistence, status]);

  return { supported: importer !== undefined, status, run };
};
