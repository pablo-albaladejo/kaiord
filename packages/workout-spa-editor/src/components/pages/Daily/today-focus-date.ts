/**
 * Pure focus-day resolution for the Daily route param. Kept separate from the
 * `useTodayRouteParams` hook so the ISO validation (the load-bearing,
 * timezone-sensitive logic) is unit-testable without wouter setup. Focus is
 * unbounded (any past/future day); only malformed dates fall back to today.
 */
import { isoToLocalDate, toIsoDate } from "./today-dates";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `iso` is a real `YYYY-MM-DD` that round-trips through the LOCAL
    constructor (rejects e.g. 2026-13-40 and UTC-shift artifacts). */
export function isRealIso(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  return toIsoDate(isoToLocalDate(iso)) === iso;
}

/** The focused ISO day: any real `YYYY-MM-DD` (past or future) is honored;
    a malformed/missing param falls back to the real today. */
export function resolveFocusIso(
  requested: string,
  realTodayIso: string
): string {
  return isRealIso(requested) ? requested : realTodayIso;
}
