/** Coaching action hooks; telemetry emitted at this boundary, no PII. */

import type { Analytics } from "@kaiord/core";
import { useCallback, useRef } from "react";

import { attemptLink } from "../../application/coaching/attempt-link";
import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { syncWeek } from "../../application/coaching/sync-week";
import type { PersistencePort } from "../../ports/persistence-port";
import { emitLinkResult, emitSyncResult } from "./coaching-telemetry";
import { shouldFanOutZones } from "./should-fan-out-zones";

export { useExpandCallback } from "./use-expand-callback";

export const useSyncCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics,
  runZonesSync?: (profileId: string) => Promise<void>
) =>
  useCallback(
    async (profileId: string, weekStart: string) => {
      a.event("coaching.sync.invoked", {
        source: t.source,
        profileId,
        trigger: "manual",
      });
      const startedAt = Date.now();
      const result = await syncWeek(
        {
          profiles: p.profiles,
          coaching: p.coaching,
          transport: t,
          coachingSyncState: p.coachingSyncState,
        },
        profileId,
        weekStart
      );
      emitSyncResult(a, t.source, profileId, result, Date.now() - startedAt);
      if (
        result.ok &&
        runZonesSync &&
        (await shouldFanOutZones(p, t.source, profileId))
      ) {
        await runZonesSync(profileId).catch(() => undefined);
      }
    },
    [p, t, a, runZonesSync]
  );

export const useConnectCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics,
  runZonesSync?: (profileId: string) => Promise<void>
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
      emitLinkResult(a, t.source, profileId, r);
      if (
        r.ok &&
        runZonesSync &&
        (await shouldFanOutZones(p, t.source, profileId))
      ) {
        await runZonesSync(profileId).catch(() => undefined);
      }
    },
    [p, t, a, runZonesSync]
  );
};
