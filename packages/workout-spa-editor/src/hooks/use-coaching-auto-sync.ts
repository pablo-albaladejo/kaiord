/**
 * useCoachingAutoSync — fires syncWeek on calendar mount + week change.
 *
 * Per spa-coaching-integration "Auto-sync with staleness gate":
 *  - For each linked source on the active profile, fire syncWeek when
 *    the staleness gate is open (now - lastSyncedAt > 10 minutes) or
 *    no row exists yet.
 *  - Auto-sync failures are silent — the source's `error` field is
 *    populated by the use case; no toast is raised here.
 *  - `expandDay` does NOT update lastSyncedAt; only this hook advances
 *    the gate (see spec).
 */

import { useEffect, useRef } from "react";

import { useAnalytics } from "../contexts";
import { usePersistence } from "../contexts/persistence-context";
import { useActiveProfile } from "./use-active-profile";
import type { CoachingSyncState } from "./use-coaching-activities";

const STALENESS_MS = 10 * 60 * 1000;

const isStale = (lastSyncedAt: string | undefined, now: number): boolean => {
  if (!lastSyncedAt) return true;
  const t = Date.parse(lastSyncedAt);
  if (Number.isNaN(t)) return true;
  return now - t > STALENESS_MS;
};

export const useCoachingAutoSync = (
  syncSources: CoachingSyncState[],
  weekStart: string | undefined
): void => {
  const { id: activeProfileId, profile } = useActiveProfile();
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const lastFiredKey = useRef<string | null>(null);

  useEffect(() => {
    if (!activeProfileId || !profile || !weekStart) return;
    const now = Date.now();
    const key = `${activeProfileId}:${weekStart}`;
    if (lastFiredKey.current === key) return;

    const linkedSourceIds = new Set(
      profile.linkedAccounts.map((a) => a.source)
    );
    const targets = syncSources.filter((s) => linkedSourceIds.has(s.id));
    if (targets.length === 0) return;

    void (async () => {
      for (const src of targets) {
        const row = await persistence.coachingSyncState.getBySourceAndProfile(
          src.id,
          activeProfileId
        );
        if (isStale(row?.lastSyncedAt, now)) {
          analytics.event("coaching.sync.invoked", {
            source: src.id,
            trigger: "auto-mount",
          });
          try {
            await src.sync(weekStart);
            // Source may have surfaced an error in src.error after sync;
            // silent failures are reflected here in telemetry.
            if (src.error) {
              analytics.event("coaching.sync.failure", {
                source: src.id,
                errorKind: "transport-error",
                isAutoSync: true,
              });
            }
          } catch (err) {
            analytics.event("coaching.sync.failure", {
              source: src.id,
              errorKind: err instanceof Error ? err.message : "unknown",
              isAutoSync: true,
            });
          }
        }
      }
      lastFiredKey.current = key;
    })();
  }, [
    activeProfileId,
    profile,
    weekStart,
    syncSources,
    persistence,
    analytics,
  ]);
};
