/**
 * Reads the Daily page's focused day from `?date=YYYY-MM-DD`. Focus is
 * unbounded (any past/future day); a malformed or missing param falls back to
 * the real today. Validation lives in the pure `resolveFocusIso`; the local
 * constructor (`isoToLocalDate`) avoids a UTC day-shift.
 */
import { useMemo } from "react";
import { useSearch } from "wouter";

import { isoToLocalDate, toIsoDate } from "./today-dates";
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
    const focusIso = resolveFocusIso(requested, realTodayIso);
    const focusDate =
      focusIso === realTodayIso ? realToday : isoToLocalDate(focusIso);

    return { focusDate, focusIso, realTodayIso };
  }, [search]);
}
