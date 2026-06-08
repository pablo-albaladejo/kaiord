/**
 * Focus-day navigation for the Today page. Writes the focused day to the URL
 * (`todayHref`) — day select, prev/next day arrows (bounded to the visible week
 * by indexing into `days`, so the edges disable structurally), and "Back to
 * Today" which clears the param.
 */
import { useCallback } from "react";
import { useLocation } from "wouter";

import type { WeekDay } from "./today-dates";
import { todayHref } from "./today-href";

export type TodayFocusNav = {
  selectDay: (iso: string) => void;
  goPrev: () => void;
  goNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  backToToday: () => void;
};

export function useTodayFocusNav(
  days: WeekDay[],
  focusIso: string,
  realTodayIso: string
): TodayFocusNav {
  const [, navigate] = useLocation();
  const index = days.findIndex((d) => d.iso === focusIso);
  const canPrev = index > 0;
  const canNext = index >= 0 && index < days.length - 1;

  const selectDay = useCallback(
    (iso: string) => navigate(todayHref(iso, realTodayIso)),
    [navigate, realTodayIso]
  );
  const goPrev = useCallback(() => {
    if (canPrev) navigate(todayHref(days[index - 1].iso, realTodayIso));
  }, [canPrev, days, index, navigate, realTodayIso]);
  const goNext = useCallback(() => {
    if (canNext) navigate(todayHref(days[index + 1].iso, realTodayIso));
  }, [canNext, days, index, navigate, realTodayIso]);
  const backToToday = useCallback(() => navigate("/today"), [navigate]);

  return { selectDay, goPrev, goNext, canPrev, canNext, backToToday };
}
