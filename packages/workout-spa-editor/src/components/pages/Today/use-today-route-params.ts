/**
 * Reads the Today page's focused day from `?date=YYYY-MM-DD`, clamped into the
 * real-today week so the WeekStrip can never render an off-week strip. A
 * malformed, missing, or out-of-week param falls back to the real today.
 * Validation + clamp live in the pure `resolveFocusIso`.
 */
import { useMemo } from "react";
import { useSearch } from "wouter";

import { isoToLocalDate, toIsoDate, weekIsos } from "./today-dates";
import { resolveFocusIso } from "./today-focus-date";

export type TodayRouteParams = {
  focusDate: Date;
  focusIso: string;
  realTodayIso: string;
};

export function useTodayRouteParams(): TodayRouteParams {
  const search = useSearch();

  return useMemo(() => {
    const realToday = new Date();
    const realTodayIso = toIsoDate(realToday);
    const requested = new URLSearchParams(search).get("date") ?? "";
    const focusIso = resolveFocusIso(
      requested,
      realTodayIso,
      weekIsos(realToday)
    );
    const focusDate =
      focusIso === realTodayIso ? realToday : isoToLocalDate(focusIso);

    return { focusDate, focusIso, realTodayIso };
  }, [search]);
}
