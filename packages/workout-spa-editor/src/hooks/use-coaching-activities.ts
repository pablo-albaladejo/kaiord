/**
 * useCoachingActivities — Consumes the CoachingSource registry.
 *
 * Calls each registered factory hook with (activeProfileId, days) to
 * materialize a CoachingSource per render. Returns activities grouped
 * by date plus per-source sync state.
 *
 * Calendar code consumes only this hook + CoachingActivity / CoachingSource
 * types — no platform-specific imports.
 */

import { useCallback, useMemo } from "react";

import { useCoachingSourceFactories } from "../contexts/coaching-registry-context";
import type { CoachingActivity } from "../types/coaching-activity";
import { useActiveProfileLive } from "./use-active-profile-live";

export type CoachingSyncState = {
  id: string;
  label: string;
  /** Source has a linkedAccount on the active profile. */
  linked: boolean;
  connected: boolean;
  loading: boolean;
  error: string | null;
  sync: (weekStart: string) => Promise<void>;
  connect: () => Promise<void>;
};

export function useCoachingActivities(days: string[]) {
  const live = useActiveProfileLive();
  const activeProfileId = live?.id ?? null;
  const profile = live?.profile ?? null;
  const factories = useCoachingSourceFactories();

  // Each factory is itself a hook; calling them in stable order from this
  // hook satisfies rules-of-hooks (factories never change at runtime —
  // they're registered once at bootstrap). The eslint plugin cannot
  // statically prove the array is stable, so this is a sanctioned
  // architectural exception. The `useFactory` parameter naming is
  // load-bearing: the plugin detects hook calls by `use*` prefix.
  const sources = factories.map((useFactory) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useFactory(activeProfileId, days)
  );

  const byDay = useMemo(() => {
    const all = sources.flatMap((s) => s.activities);
    const grouped: Record<string, CoachingActivity[]> = {};
    for (const day of days) {
      grouped[day] = all.filter((a) => a.date === day);
    }
    return grouped;
  }, [sources, days]);

  const expandActivity = useCallback(
    (activity: CoachingActivity) => {
      if (!activeProfileId) return;
      const source = sources.find((s) => s.id === activity.source);
      void source?.expand(activeProfileId, activity.date);
    },
    [sources, activeProfileId]
  );

  const linkedSourceIds = useMemo(() => {
    if (!profile) return new Set<string>();
    return new Set(profile.linkedAccounts.map((a) => a.source));
  }, [profile]);

  const syncSources: CoachingSyncState[] = sources
    .filter((s) => s.available)
    .map((s) => ({
      id: s.id,
      label: s.label,
      linked: linkedSourceIds.has(s.id),
      connected: s.connected,
      loading: s.loading,
      error: s.error,
      sync: async (weekStart: string) => {
        if (!activeProfileId) return;
        await s.sync(activeProfileId, weekStart);
      },
      connect: async () => {
        if (!activeProfileId) return;
        await s.connect(activeProfileId);
      },
    }));

  return { byDay, expandActivity, syncSources };
}
