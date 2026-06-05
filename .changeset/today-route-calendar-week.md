---
"@kaiord/workout-spa-editor": patch
---

One URL family, one view: Today moves to /today, /calendar is the week grid

The Today dashboard now lives at `/today` (the app home — `/` redirects
there), and bare `/calendar` redirects in one hop to the current week's
grid, so every `/calendar*` URL renders the same week view with
week-scoped data (TrainingPeaks-style). Navigation gains a Calendar entry
(mobile bottom-nav: Today · Calendar · Library · Athlete, with Settings
now header-only) and the `?from=` back contract carries the originating
`week`, so leaving a workout opened from another week returns to that
week's grid. Scheduling a template from the library now lands on the
scheduled week instead of the calendar home.
