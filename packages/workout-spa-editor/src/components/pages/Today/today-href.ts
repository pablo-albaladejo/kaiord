/**
 * Canonical href for the Today page at a given focus day.
 *
 * The real today is the canonical, param-less `/today`; any other focused day
 * is carried as `?date=YYYY-MM-DD`. Used at every write site (day select, day
 * arrows, back-origin date carry) so the "no param when focus == today" rule
 * cannot drift between callers.
 */
export function todayHref(focusIso: string, realTodayIso: string): string {
  return focusIso === realTodayIso ? "/today" : `/today?date=${focusIso}`;
}
