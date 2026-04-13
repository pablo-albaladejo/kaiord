/**
 * useCoachingActivities — Consumes the CoachingSource registry.
 *
 * Zero platform imports. Zero platform knowledge.
 * Returns activities grouped by date + per-source sync state.
 */

import { useCallback, useMemo } from "react";

import { useCoachingSources } from "../contexts/coaching-registry-context";
import type { CoachingActivity } from "../types/coaching-activity";

export function useCoachingActivities(days: string[]) {
  const sources = useCoachingSources();

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
      const source = sources.find((s) => s.id === activity.source);
      source?.expand(activity.date);
    },
    [sources]
  );

  const syncSources: CoachingSyncState[] = sources
    .filter((s) => s.available)
    .map((s) => ({
      id: s.id,
      label: s.label,
      connected: s.connected,
      loading: s.loading,
      error: s.error,
      sync: s.sync,
      connect: s.connect,
    }));

  return { byDay, expandActivity, syncSources };
}

export type CoachingSyncState = {
  id: string;
  label: string;
  connected: boolean;
  loading: boolean;
  error: string | null;
  sync: (weekStart: string) => void;
  connect: () => void;
};
