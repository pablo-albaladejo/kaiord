/**
 * Coaching action hooks; telemetry emitted at this boundary, no PII. The
 * use cases load on first call: the hooks mount app-wide, the actions only
 * run on a user action.
 */

import type { Analytics } from "@kaiord/core";
import { useCallback } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { useCoachMoveNoticeActions } from "../../contexts/coach-move-notice-context";
import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import { emitSyncResult } from "./coaching-telemetry";
import { shouldFanOutZones } from "./should-fan-out-zones";

export { useConnectCallback } from "./use-connect-callback";
export { useExpandCallback } from "./use-expand-callback";

const NOT_LOADED = { ok: false, reason: "app-part-not-loaded" } as const;

/** `onNotLoaded` tells the athlete part of the App did not load, so nothing
    was asked of Train2Go: the use case's code, or the transport's. */
export const useSyncCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics,
  runZonesSync?: (profileId: string) => Promise<void>,
  onNotLoaded?: () => void
) => {
  const { report } = useCoachMoveNoticeActions();
  return useCallback(
    async (profileId: string, weekStart: string) => {
      a.event("coaching.sync.invoked", {
        source: t.source,
        trigger: "manual",
      });
      const loaded = await lazyImport(
        () => import("../../application/coaching/sync-week")
      ).catch(() => null);
      if (!loaded) {
        emitSyncResult(a, t.source, NOT_LOADED, 0);
        onNotLoaded?.();
        return;
      }
      const startedAt = Date.now();
      const result = await loaded.syncWeek(
        {
          profiles: p.profiles,
          coaching: p.coaching,
          transport: t,
          coachingSyncState: p.coachingSyncState,
          workouts: p.workouts,
          sessionMatch: p.sessionMatch,
          transaction: p.transaction,
          integrationPolicy: p.integrationPolicy,
        },
        profileId,
        weekStart
      );
      emitSyncResult(a, t.source, result, Date.now() - startedAt);
      if (!result.ok && result.reason === NOT_LOADED.reason) onNotLoaded?.();
      if (result.ok) report(profileId, weekStart, result);
      if (
        result.ok &&
        runZonesSync &&
        (await shouldFanOutZones(p, t.source, profileId))
      ) {
        await runZonesSync(profileId).catch(() => undefined);
      }
    },
    [p, t, a, runZonesSync, report, onNotLoaded]
  );
};
