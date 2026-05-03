/**
 * Train2Go CoachingSource adapter — factory hook.
 *
 * Materializes a CoachingSource for a given (activeProfileId, days).
 * Activities come from a useLiveQuery over the persisted
 * coachingActivities table; sync/expand/connect delegate to application
 * use cases (extracted to use-train2go-actions.ts to stay under lint).
 */

import { useCallback, useMemo } from "react";

import { useAnalytics } from "../../contexts";
import { usePersistence } from "../../contexts/persistence-context";
import { useToastContext } from "../../contexts/ToastContext";
import { useTrain2GoStore } from "../../store/train2go-store";
import type { CoachingSource } from "../../types/coaching-source";
import { bridgeDiscovery } from "../bridge/bridge-discovery";
import { createTrain2GoCoachingTransport } from "./train2go-coaching-transport";
import {
  useConnectCallback,
  useExpandCallback,
  useSyncCallback,
} from "./use-train2go-actions";
import {
  useCoachingActivities,
  useTrain2GoSyncState,
} from "./use-train2go-data";
import {
  useZonesSyncOrchestrator,
  type ZonesSyncOrchestrator,
} from "./use-zones-sync-orchestrator";

export type Train2GoSource = CoachingSource & {
  zonesSync: ZonesSyncOrchestrator;
};

const TRAIN2GO = "train2go";

const getExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("train2go-bridge") ?? "";

export function useTrain2GoSource(
  activeProfileId: string | null,
  days: string[]
): Train2GoSource {
  const store = useTrain2GoStore();
  const persistence = usePersistence();
  const toasts = useToastContext();
  const analytics = useAnalytics();

  const transport = useMemo(
    () => createTrain2GoCoachingTransport(getExtensionId),
    []
  );
  const zonesSync = useZonesSyncOrchestrator(persistence, transport, toasts);
  const activities = useCoachingActivities(persistence, activeProfileId, days);
  const lastSyncedAt = useTrain2GoSyncState(persistence, activeProfileId);

  const sync = useSyncCallback(
    persistence,
    transport,
    analytics,
    zonesSync.runSync
  );
  const expand = useExpandCallback(persistence, transport, analytics);
  const connectImpl = useConnectCallback(
    persistence,
    transport,
    analytics,
    zonesSync.runSync
  );

  // Wrap the inner connect so a successful link forces an immediate
  // re-detect, bypassing the 30s detection cache. Without this the
  // calendar header stays on "Connect to Train2Go" until the cache
  // expires, contradicting the Profile Manager which already shows
  // the freshly-linked account.
  const connect = useCallback(
    async (profileId: string) => {
      await connectImpl(profileId);
      await store.detectExtension({ force: true });
    },
    [connectImpl, store]
  );

  return {
    id: TRAIN2GO,
    label: "Train2Go",
    badge: "T2G",
    available: store.extensionInstalled,
    connected: store.sessionActive,
    loading: store.loading,
    error: store.lastError,
    activities,
    lastSyncedAt,
    sync,
    expand,
    connect,
    zonesSync,
  };
}
