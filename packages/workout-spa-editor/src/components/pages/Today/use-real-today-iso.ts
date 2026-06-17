/**
 * useRealTodayIso — the current LOCAL calendar day as `YYYY-MM-DD`, advancing
 * while the app stays open instead of freezing at load (#748).
 *
 * It re-derives at the next local midnight (the timer is re-armed each day)
 * and whenever the tab regains visibility or window focus — so a session left
 * open overnight (or backgrounded across midnight) still circles the right
 * "today" and defaults the Daily focus to it.
 */
import { useEffect, useState } from "react";

import { toIsoDate } from "./today-dates";

const PAST_MIDNIGHT_SLACK_MS = 1000;

const msUntilNextMidnight = (now: Date): number => {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + PAST_MIDNIGHT_SLACK_MS;
};

export function useRealTodayIso(): string {
  const [todayIso, setTodayIso] = useState(() => toIsoDate(new Date()));

  useEffect(() => {
    const sync = () =>
      setTodayIso((prev) => {
        const next = toIsoDate(new Date());
        return prev === next ? prev : next;
      });

    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      timer = setTimeout(() => {
        sync();
        arm();
      }, msUntilNextMidnight(new Date()));
    };
    arm();

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return todayIso;
}
