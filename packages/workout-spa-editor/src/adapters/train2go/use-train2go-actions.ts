/** Coaching action hooks; telemetry emitted at this boundary, no PII. */

import type { Analytics } from "@kaiord/core";
import { useCallback, useRef } from "react";

import { attemptLink } from "../../application/coaching/attempt-link";
import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { expandDay } from "../../application/coaching/expand-day";
import { syncWeek } from "../../application/coaching/sync-week";
import type { PersistencePort } from "../../ports/persistence-port";
import { emitLinkResult, emitSyncResult } from "./coaching-telemetry";

const baseDeps = (p: PersistencePort, t: CoachingTransport) => ({
  profiles: p.profiles,
  coaching: p.coaching,
  transport: t,
});

export const useSyncCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics
) =>
  useCallback(
    async (profileId: string, weekStart: string) => {
      a.event("coaching.sync.invoked", { source: t.source, trigger: "manual" });
      const startedAt = Date.now();
      const result = await syncWeek(
        { ...baseDeps(p, t), coachingSyncState: p.coachingSyncState },
        profileId,
        weekStart
      );
      emitSyncResult(a, t.source, result, Date.now() - startedAt);
    },
    [p, t, a]
  );

export const useExpandCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics
) =>
  useCallback(
    async (profileId: string, date: string) => {
      a.event("coaching.expand_day.invoked", { source: t.source });
      await expandDay(baseDeps(p, t), profileId, date);
    },
    [p, t, a]
  );

export const useConnectCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics
) => {
  const abortRef = useRef<AbortController | null>(null);
  return useCallback(
    async (profileId: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const r = await attemptLink(
        { profiles: p.profiles, transport: t },
        profileId,
        ctrl.signal
      );
      emitLinkResult(a, t.source, r);
    },
    [p, t, a]
  );
};
