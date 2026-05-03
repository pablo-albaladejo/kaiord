/**
 * Train2Go CoachingSource adapter — factory hook.
 *
 * Materializes a CoachingSource for a given (activeProfileId, days).
 * Activities come from a useLiveQuery over the persisted
 * coachingActivities table; sync/expand/connect delegate to application
 * use cases (extracted to use-train2go-actions.ts to stay under lint).
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo } from "react";

import { useAnalytics } from "../../contexts";
import { usePersistence } from "../../contexts/persistence-context";
import { useTrain2GoStore } from "../../store/train2go-store";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { CoachingSource } from "../../types/coaching-source";
import { bridgeDiscovery } from "../bridge/bridge-discovery";
import { toCoachingActivity } from "./coaching-record-to-activity.converter";
import { createTrain2GoCoachingTransport } from "./train2go-coaching-transport";
import {
  useConnectCallback,
  useExpandCallback,
  useSyncCallback,
} from "./use-train2go-actions";

const TRAIN2GO = "train2go";

const getExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("train2go-bridge") ?? "";

export function useTrain2GoSource(
  activeProfileId: string | null,
  days: string[]
): CoachingSource {
  const store = useTrain2GoStore();
  const persistence = usePersistence();

  const transport = useMemo(
    () => createTrain2GoCoachingTransport(getExtensionId),
    []
  );

  const start = days[0] ?? "";
  const end = days[days.length - 1] ?? "";
  const records = useLiveQuery(() => {
    if (!activeProfileId || !start || !end) return Promise.resolve([]);
    return persistence.coaching.getByProfileAndDateRange(
      activeProfileId,
      start,
      end
    );
  }, [activeProfileId, start, end]);

  const syncStateRow = useLiveQuery(() => {
    if (!activeProfileId) return Promise.resolve(undefined);
    return persistence.coachingSyncState.getBySourceAndProfile(
      TRAIN2GO,
      activeProfileId
    );
  }, [activeProfileId]);

  const activities: CoachingActivity[] = useMemo(
    () => (records ?? []).map(toCoachingActivity),
    [records]
  );

  const analytics = useAnalytics();
  const sync = useSyncCallback(persistence, transport, analytics);
  const expand = useExpandCallback(persistence, transport, analytics);
  const connectImpl = useConnectCallback(persistence, transport, analytics);

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
    lastSyncedAt: syncStateRow?.lastSyncedAt,
    sync,
    expand,
    connect,
  };
}
