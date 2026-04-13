/**
 * Train2Go CoachingSource adapter.
 *
 * Bridges the Train2Go Zustand store to the generic CoachingSource port.
 * This is the only file that imports both the store and the mapper.
 */

import { useCallback, useMemo } from "react";

import { useTrain2GoStore } from "../../store/train2go-store";
import type { CoachingSource } from "../../types/coaching-source";
import { toCoachingActivity } from "./train2go-mapper";

export function useTrain2GoSource(): CoachingSource {
  const store = useTrain2GoStore();

  const activities = useMemo(
    () => store.activities.map(toCoachingActivity),
    [store.activities]
  );

  const sync = useCallback(
    (weekStart: string) => store.fetchWeek(weekStart),
    [store.fetchWeek]
  );

  const expand = useCallback(
    (date: string) => store.fetchDay(date),
    [store.fetchDay]
  );

  const connect = useCallback(async () => {
    await store.openTrain2Go();
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      await store.detectExtension();
      if (useTrain2GoStore.getState().sessionActive) break;
    }
  }, [store.openTrain2Go, store.detectExtension]);

  return {
    id: "train2go",
    label: "Train2Go",
    badge: "T2G",
    available: store.extensionInstalled,
    connected: store.sessionActive,
    loading: store.loading,
    error: store.lastError,
    activities,
    sync,
    expand,
    connect,
  };
}
