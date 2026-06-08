/**
 * Pure focus-day resolution for the Today route param. Kept separate from the
 * `useTodayRouteParams` hook so the clamp + ISO validation (the load-bearing,
 * timezone-sensitive logic) is unit-testable without wouter/time setup.
 */
import { isoToLocalDate, toIsoDate } from "./today-dates";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `iso` is a real `YYYY-MM-DD` that round-trips through the LOCAL
    constructor (rejects e.g. 2026-13-40 and UTC-shift artifacts). */
export function isRealIso(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  return toIsoDate(isoToLocalDate(iso)) === iso;
}

/** The focused ISO day: the requested one when it is a real date inside the
    given week, otherwise the real today (clamp/fallback — AC8). */
export function resolveFocusIso(
  requested: string,
  realTodayIso: string,
  week: string[]
): string {
  if (!isRealIso(requested)) return realTodayIso;
  if (requested < week[0] || requested > week[week.length - 1]) {
    return realTodayIso;
  }
  return requested;
}
