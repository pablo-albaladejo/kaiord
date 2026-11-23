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
import { KEPT_COPY } from "../adapters/train2go/zones-offer-copy";
import type { ZonesOfferKind } from "../adapters/train2go/zones-offer-kind";
import { useTranslate } from "../i18n/use-translate";
import { usePersistence } from "./persistence-context";
import { useToastContext } from "./ToastContext";

const Ctx = createContext<ZonesSyncOrchestrator | null>(null);

const getExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("train2go-bridge") ?? "";

const OFFER_MS = 12_000;

const ACTION =
  "rounded-md bg-white/10 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/20";

export const Train2GoZonesSyncProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const persistence = usePersistence();
  const toasts = useToastContext();
  const t = useTranslate("coaching");
  const transport = useMemo(
    () => createTrain2GoCoachingTransport(getExtensionId),
    []
  );
  const offerTheirs = useMemo(
    () => (kind: ZonesOfferKind, takeTheirs: () => Promise<void>) => {
      toasts.info(t(KEPT_COPY[kind]), t("zonesSync.keptHint"), {
        duration: OFFER_MS,
        action: (
          <button
            type="button"
            className={ACTION}
            data-testid="zones-use-theirs"
            onClick={() => void takeTheirs()}
          >
            {t("zonesSync.takeTheirs")}
          </button>
        ),
      });
    },
    [toasts, t]
  );
  const orchestrator = useZonesSyncOrchestrator(
    persistence,
    transport,
    toasts,
    offerTheirs
  );
  useZonesAutoImportOnMount(persistence, orchestrator.runSync);

  return <Ctx.Provider value={orchestrator}>{children}</Ctx.Provider>;
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
