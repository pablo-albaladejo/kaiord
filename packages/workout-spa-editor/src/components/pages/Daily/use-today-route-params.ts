/**
 * Reads the Daily page's focused day from `?date=YYYY-MM-DD`. Focus is
 * unbounded (any past/future day); a malformed or missing param falls back to
 * the real today. Validation lives in the pure `resolveFocusIso`; the local
 * constructor (`isoToLocalDate`) avoids a UTC day-shift.
 *
 * `realTodayIso` comes from `useRealTodayIso`, so it advances at midnight /
 * on tab refocus and the memo re-derives the default focus with it (#748).
 */
import { useMemo } from "react";
import { useSearch } from "wouter";

import { isoToLocalDate } from "./today-dates";
import { resolveFocusIso } from "./today-focus-date";
import { useRealTodayIso } from "./use-real-today-iso";

export type TodayRouteParams = {
  focusDate: Date;
  focusIso: string;
  realTodayIso: string;
};

export function useTodayRouteParams(): TodayRouteParams {
  const search = useSearch();
  const realTodayIso = useRealTodayIso();

  return useMemo(() => {
    const requested = new URLSearchParams(search).get("date") ?? "";
    const focusIso = resolveFocusIso(requested, realTodayIso);
    const focusDate =
      focusIso === realTodayIso ? new Date() : isoToLocalDate(focusIso);

    return { focusDate, focusIso, realTodayIso };
  }, [search, realTodayIso]);
}
