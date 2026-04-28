/**
 * useCoachingAutoSync — fires syncWeek on calendar mount + week change.
 *
 * Per spa-coaching-integration "Auto-sync with staleness gate":
 *  - For each linked source on the active profile, fire syncWeek when
 *    the staleness gate is open (now - lastSyncedAt > 10 minutes) or
 *    no row exists yet.
 *  - Auto-sync failures are silent — the source's `error` field is
 *    populated by the use case; no toast is raised here.
 *  - `expandDay` does NOT update lastSyncedAt; only this hook advances.
 *
 * Telemetry: `trigger` differentiates initial mount from week navigation;
 * `errorKind` is a low-cardinality enum and NEVER raw exception text.
 */

import { useEffect, useRef } from "react";

import { useAnalytics } from "../contexts";
import { usePersistence } from "../contexts/persistence-context";
import { useActiveProfile } from "./use-active-profile";
import type { CoachingSyncState } from "./use-coaching-activities";
import { runSourceSync } from "./use-coaching-auto-sync-helpers";

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
    const trigger =
      lastFiredKey.current === null ? "auto-mount" : "auto-week-change";
    lastFiredKey.current = key;

    const linkedSourceIds = new Set(
      profile.linkedAccounts.map((a) => a.source)
    );
    const targets = syncSources.filter((s) => linkedSourceIds.has(s.id));
    if (targets.length === 0) return;

    void (async () => {
      for (const src of targets) {
        await runSourceSync(
          src,
          activeProfileId,
          weekStart,
          trigger,
          now,
          persistence,
          analytics
        );
      }
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
