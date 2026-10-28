import { useEffect, useRef } from "react";

import type { CoachingActivity } from "../types/coaching-activity";
import type { ExpandDayResult } from "../types/coaching-expand-result";
import type { CoachingSyncState } from "./use-coaching-activities";

type ExpandActivity = (
  activity: CoachingActivity
) => Promise<ExpandDayResult | undefined>;

// One attempt per profile, source and day for the page's lifetime, success or
// not: the registry hands out a new `expand` on every render, so a failed
// read must not come back on the next one. The dialog keeps its own retry.
const attempted = new Set<string>();

export const resetDescriptionPrefetch = (): void => attempted.clear();

const pendingDays = (
  profileId: string,
  plans: readonly CoachingActivity[],
  connected: ReadonlySet<string>
): Map<string, CoachingActivity> => {
  const pending = new Map<string, CoachingActivity>();
  for (const plan of plans) {
    const key = `${profileId}|${plan.source}|${plan.date}`;
    if (plan.description !== undefined || !connected.has(plan.source)) continue;
    if (!attempted.has(key)) pending.set(key, plan);
  }
  return pending;
};

/**
 * Reads the coach's text for the visible week's unmatched plans, one day at a
 * time, so their cards can draw an estimated profile without being opened.
 * Only sources that are linked and connected are asked.
 */
export function useCoachingDescriptionPrefetch(
  profileId: string | null,
  plansByDay: Record<string, readonly CoachingActivity[]>,
  sources: readonly CoachingSyncState[],
  expand: ExpandActivity
): void {
  const expandRef = useRef(expand);
  expandRef.current = expand;
  const connected = sources
    .filter((s) => s.linked && s.connected)
    .map((s) => s.id)
    .join(",");

  useEffect(() => {
    if (!profileId) return;
    const plans = Object.values(plansByDay).flat();
    const pending = pendingDays(
      profileId,
      plans,
      new Set(connected.split(","))
    );
    let cancelled = false;
    void (async () => {
      for (const [key, plan] of pending) {
        if (cancelled) return;
        attempted.add(key);
        await expandRef.current(plan).catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, plansByDay, connected]);
}
