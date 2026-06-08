---
"@kaiord/workout-spa-editor": minor
---

Rename the Today page to Daily, with unlimited cross-week navigation

The movable-focus dashboard is now "Daily" at `/daily` (the old `/today`
redirects to `/daily`, preserving `?date=`, and the `?from=today` back-origin
is still accepted). The focus day can now navigate across weeks in both
directions without limit — the previous/next day arrows shift the WeekStrip to
the adjacent week instead of stopping at the week edge (which previously left no
way to go back when today was a Monday). The real-today marker shows only when
the real today is in the visible week; "Back to Today" remains the way to jump
to the literal today.
