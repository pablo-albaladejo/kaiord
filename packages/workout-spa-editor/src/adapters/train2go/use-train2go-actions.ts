/**
 * Coaching action hooks; telemetry emitted at this boundary, no PII. The
 * use cases load on first call: the hooks mount app-wide, the actions only
 * run on a user action.
 */

import type { Analytics } from "@kaiord/core";
import { useCallback, useRef } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { useCoachMoveNoticeActions } from "../../contexts/coach-move-notice-context";
import type { PersistencePort } from "../../ports/persistence-port";
import { seedBridgeRoutes } from "../bridge/seed-bridge-routes";
import { emitLinkResult, emitSyncResult } from "./coaching-telemetry";
import { shouldFanOutZones } from "./should-fan-out-zones";

export { useExpandCallback } from "./use-expand-callback";

const TRAIN2GO_BRIDGE = "train2go-bridge";

export const useSyncCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics,
  runZonesSync?: (profileId: string) => Promise<void>
) => {
  const { report } = useCoachMoveNoticeActions();
  return useCallback(
    async (profileId: string, weekStart: string) => {
      a.event("coaching.sync.invoked", {
        source: t.source,
        trigger: "manual",
      });
      const { syncWeek } = await import("../../application/coaching/sync-week");
      const startedAt = Date.now();
      const result = await syncWeek(
        {
          profiles: p.profiles,
          coaching: p.coaching,
          transport: t,
          coachingSyncState: p.coachingSyncState,
          workouts: p.workouts,
          transaction: p.transaction,
          integrationPolicy: p.integrationPolicy,
        },
        profileId,
        weekStart
      );
      emitSyncResult(a, t.source, result, Date.now() - startedAt);
      if (result.ok) report(profileId, weekStart, result);
      if (
        result.ok &&
        runZonesSync &&
        (await shouldFanOutZones(p, t.source, profileId))
      ) {
        await runZonesSync(profileId).catch(() => undefined);
      }
    },
    [p, t, a, runZonesSync, report]
  );
};

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
      const { attemptLink } =
        await import("../../application/coaching/attempt-link");
      const r = await attemptLink(
        { profiles: p.profiles, transport: t },
        profileId,
        ctrl.signal
      );
      emitLinkResult(a, t.source, r);
      if (!r.ok) return;
      await seedBridgeRoutes(p, profileId, TRAIN2GO_BRIDGE);
      if (runZonesSync && (await shouldFanOutZones(p, t.source, profileId))) {
        await runZonesSync(profileId).catch(() => undefined);
      }
    },
    [p, t, a, runZonesSync]
  );
};
