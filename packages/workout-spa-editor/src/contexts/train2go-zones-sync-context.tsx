/**
 * Train2GoZonesSyncProvider — single source of truth for the
 * zones-sync orchestrator across the app.
 *
 * Before this lived in a context, every call site of `useTrain2GoSource`
 * created its own `useZonesSyncOrchestrator` instance. Two consumers
 * (the calendar header's sync button and the Profile Manager's
 * Linked Account row) ended up with disjoint state — clicking sync on
 * the calendar set `pending` on instance A, while the dialog was
 * mounted under instance B and never saw it. Lifting the orchestrator
 * into one provider fixes that integration gap, and rendering the
 * dialog INSIDE the provider lets it appear regardless of which
 * trigger fired.
 */
import { createContext, type ReactNode, useContext, useMemo } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createTrain2GoCoachingTransport } from "../adapters/train2go/train2go-coaching-transport";
import { useZonesAutoImportOnMount } from "../adapters/train2go/use-zones-auto-import-on-mount";
import {
  useZonesSyncOrchestrator,
  type ZonesSyncOrchestrator,
} from "../adapters/train2go/use-zones-sync-orchestrator";
import { ZonesConflictDialog } from "../components/organisms/ZonesConflictDialog/ZonesConflictDialog";
import { usePersistence } from "./persistence-context";
import { useToastContext } from "./ToastContext";

const Ctx = createContext<ZonesSyncOrchestrator | null>(null);

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
  const orchestrator = useZonesSyncOrchestrator(persistence, transport, toasts);
  useZonesAutoImportOnMount(persistence, orchestrator.runSync);

  return (
    <Ctx.Provider value={orchestrator}>
      {children}
      <ZonesConflictDialog
        open={orchestrator.pending !== null}
        conflicts={orchestrator.pending?.conflicts ?? []}
        onConfirm={orchestrator.confirmDecisions}
        onCancel={orchestrator.cancel}
      />
    </Ctx.Provider>
  );
};

export const useTrain2GoZonesSync = (): ZonesSyncOrchestrator => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useTrain2GoZonesSync must be used within Train2GoZonesSyncProvider"
    );
  }
  return ctx;
};
