/**
 * Focus-day navigation for the Daily page. Writes the focused day to the URL
 * (`dailyHref`) — day select, prev/next day arrows (unbounded: cross-week via
 * `addDaysIso`, so the strip re-anchors to the adjacent week), and "Back to
 * Today" which jumps to the literal today (bare `/daily`).
 */
import { useCallback } from "react";
import { useLocation } from "wouter";

import { dailyHref } from "./daily-href";
import { addDaysIso } from "./today-dates";

export type TodayFocusNav = {
  selectDay: (iso: string) => void;
  goPrev: () => void;
  goNext: () => void;
  backToToday: () => void;
};

export function useTodayFocusNav(
  focusIso: string,
  realTodayIso: string
): TodayFocusNav {
  const [, navigate] = useLocation();

  const selectDay = useCallback(
    (iso: string) => navigate(dailyHref(iso, realTodayIso)),
    [navigate, realTodayIso]
  );
  const goPrev = useCallback(
    () => navigate(dailyHref(addDaysIso(focusIso, -1), realTodayIso)),
    [navigate, focusIso, realTodayIso]
  );
  const goNext = useCallback(
    () => navigate(dailyHref(addDaysIso(focusIso, 1), realTodayIso)),
    [navigate, focusIso, realTodayIso]
  );
  const backToToday = useCallback(
    () => navigate(dailyHref(realTodayIso, realTodayIso)),
    [navigate, realTodayIso]
  );

  return { selectDay, goPrev, goNext, backToToday };
}
