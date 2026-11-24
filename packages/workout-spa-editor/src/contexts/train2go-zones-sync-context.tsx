/**
 * Train2GoZonesSyncProvider — the one zones-sync orchestrator for the whole
 * App, so the calendar's sync button and the Athlete page share it.
 *
 * Where Train2Go reports zones or thresholds different from the ones the
 * athlete set, Kaiord keeps the athlete's and says so once, naming which, with
 * one action to take Train2Go's instead: no dialog asks which one decides.
 * The offer stays on the Athlete page after the notice is gone.
 */
import { createContext, type ReactNode, useContext, useMemo } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createTrain2GoCoachingTransport } from "../adapters/train2go/train2go-coaching-transport";
import { useZonesAutoImportOnMount } from "../adapters/train2go/use-zones-auto-import-on-mount";
import {
  useZonesSyncOrchestrator,
  type ZonesSyncOrchestrator,
} from "../adapters/train2go/use-zones-sync-orchestrator";
import { usePersistence } from "./persistence-context";
import { useToastContext } from "./ToastContext";
import { useTrain2GoZonesToasts } from "./use-train2go-zones-toasts";

/** The orchestrator, plus the notice for a Train2Go action whose code did
    not load (week sync, connect): nothing was asked of Train2Go. */
export type Train2GoZonesSync = ZonesSyncOrchestrator & {
  showNotLoaded: () => void;
};

const Ctx = createContext<Train2GoZonesSync | null>(null);

const getExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("train2go-bridge") ?? "";

export const Train2GoZonesSyncProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const persistence = usePersistence();
  const toasts = useToastContext();
  const transport = useMemo(
    () => createTrain2GoCoachingTransport(getExtensionId),
    []
  );
  const { offerTheirs, showNotLoaded } = useTrain2GoZonesToasts();
  const orchestrator = useZonesSyncOrchestrator(
    persistence,
    transport,
    toasts,
    offerTheirs,
    showNotLoaded
  );
  useZonesAutoImportOnMount(persistence, orchestrator.runSync);
  const value = useMemo(
    () => ({ ...orchestrator, showNotLoaded: () => showNotLoaded() }),
    [orchestrator, showNotLoaded]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTrain2GoZonesSync = (): Train2GoZonesSync => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useTrain2GoZonesSync must be used within Train2GoZonesSyncProvider"
    );
  }
  return ctx;
};
