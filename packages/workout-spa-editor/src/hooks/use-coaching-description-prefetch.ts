import { useEffect, useRef } from "react";

import type { CoachingActivity } from "../types/coaching-activity";
import type { ExpandDayResult } from "../types/coaching-expand-result";
import type { CoachingSyncState } from "./use-coaching-activities";

type ExpandActivity = (
  activity: CoachingActivity
) => Promise<ExpandDayResult | undefined>;

const pendingDays = (
  profileId: string,
  plans: readonly CoachingActivity[],
  connected: ReadonlySet<string>,
  attempted: ReadonlySet<string>
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
 * Only sources that are linked and connected are asked. Each profile, source
 * and day is tried once while the calendar is mounted, success or not: the
 * registry hands out a new `expand` on every render, so a failed read must
 * not come back on the next one. The dialog keeps its own retry.
 */
export function useCoachingDescriptionPrefetch(
  profileId: string | null,
  plansByDay: Record<string, readonly CoachingActivity[]>,
  sources: readonly CoachingSyncState[],
  expand: ExpandActivity
): void {
  const expandRef = useRef(expand);
  expandRef.current = expand;
  const attempted = useRef(new Set<string>());
  // Every batch chains onto the previous one, so a re-render never starts a
  // second read while one is still in flight.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const connected = sources
    .filter((s) => s.linked && s.connected)
    .map((s) => s.id)
    .join(",");

  useEffect(() => {
    if (!profileId) return;
    const run = expandRef.current;
    const plans = Object.values(plansByDay).flat();
    const online = new Set(connected.split(","));
    const tried = attempted.current;
    let cancelled = false;
    for (const [key, plan] of pendingDays(profileId, plans, online, tried)) {
      queue.current = queue.current.then(async () => {
        if (cancelled || tried.has(key)) return;
        tried.add(key);
        await run(plan).catch(() => undefined);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [profileId, plansByDay, connected]);
}
