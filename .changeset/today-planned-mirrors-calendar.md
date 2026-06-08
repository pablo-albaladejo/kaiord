---
"@kaiord/workout-spa-editor": patch
---

Today's planned section mirrors the calendar

The Today page's planned section now shows the same entries the calendar shows
for today — coaching activities, matched sessions, and workouts (including
KRD-less coaching-derived ones) — instead of "Nothing planned today" whenever
the day's activities were coaching-only. It reuses the calendar's
`buildCalendarBuckets` (week-scoped, deduped) and card rendering, so the two
surfaces stay consistent by construction. WeekStrip load-bar parity for
coaching-only days is tracked as a follow-up.
