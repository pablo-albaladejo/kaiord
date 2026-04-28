/**
 * Coaching action hooks for the Train2Go source adapter.
 *
 * Extracted from use-train2go-source.ts to keep that file under the lint
 * size limit. Each hook returns a stable callback that delegates to an
 * application-layer use case.
 */

import { useCallback, useRef } from "react";

import { attemptLink } from "../../application/coaching/attempt-link";
import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { expandDay } from "../../application/coaching/expand-day";
import { syncWeek } from "../../application/coaching/sync-week";
import type { PersistencePort } from "../../ports/persistence-port";

export const useSyncCallback = (
  persistence: PersistencePort,
  transport: CoachingTransport
) =>
  useCallback(
    async (profileId: string, weekStart: string) => {
      await syncWeek(
        {
          profiles: persistence.profiles,
          coaching: persistence.coaching,
          coachingSyncState: persistence.coachingSyncState,
          transport,
        },
        profileId,
        weekStart
      );
    },
    [persistence, transport]
  );

export const useExpandCallback = (
  persistence: PersistencePort,
  transport: CoachingTransport
) =>
  useCallback(
    async (profileId: string, date: string) => {
      await expandDay(
        {
          profiles: persistence.profiles,
          coaching: persistence.coaching,
          transport,
        },
        profileId,
        date
      );
    },
    [persistence, transport]
  );

export const useConnectCallback = (
  persistence: PersistencePort,
  transport: CoachingTransport
) => {
  const abortRef = useRef<AbortController | null>(null);
  return useCallback(
    async (profileId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      await attemptLink(
        { profiles: persistence.profiles, transport },
        profileId,
        controller.signal
      );
    },
    [persistence, transport]
  );
};
