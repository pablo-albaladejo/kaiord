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
import { useActiveProfileLive } from "./use-active-profile-live";
import type { CoachingSyncState } from "./use-coaching-activities";
import {
  runSourceSync,
  type SourceSyncOutcome,
} from "./use-coaching-auto-sync-helpers";

export const useCoachingAutoSync = (
  syncSources: CoachingSyncState[],
  weekStart: string | undefined
): void => {
  const live = useActiveProfileLive();
  const activeProfileId = live?.id ?? null;
  const profile = live?.profile ?? null;
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
    // Bridge detection can resolve AFTER profile/week state settles, so an
    // empty-sources run must not stamp the fired key — otherwise the re-run
    // that arrives with real sources hits the key guard and this week's
    // auto-sync is permanently skipped.
    if (targets.length === 0) return;

    const trigger =
      lastFiredKey.current === null ? "auto-mount" : "auto-week-change";
    lastFiredKey.current = key;

    void (async () => {
      const outcomes: { source: string; outcome: SourceSyncOutcome }[] = [];
      for (const src of targets) {
        const outcome = await runSourceSync(
          src,
          activeProfileId,
          weekStart,
          trigger,
          now,
          persistence,
          analytics
        );
        outcomes.push({ source: src.id, outcome });
      }
      // Low-cardinality completion summary so the silent auto-sync loop is
      // observable in telemetry (counts only — never per-source error text).
      analytics.event("coaching.autosync.completed", {
        trigger,
        synced: outcomes.filter((o) => o.outcome === "synced").length,
        skipped: outcomes.filter((o) => o.outcome === "skipped").length,
        failed: outcomes.filter((o) => o.outcome === "failed").length,
      });
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
