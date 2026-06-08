---
"@kaiord/workout-spa-editor": minor
---

Daily WeekStrip shows per-day presence + intensity; Planned entries open in place

The Daily page's WeekStrip no longer shows a flat workout-only load bar (which
rendered an identical dash on coaching-only days). Each day now shows a
presence + coarse intensity mark across all sources (workouts, coaching, matched
sessions): an empty day is a faint hairline; a day with entries shows an
intensity-tinted dot (filled for measured TSS, outline for estimated coaching
effort) plus a count when 2+ entries; the real today is marked with a circled
day number. Tapping a "Planned" entry now opens it in place — a coaching
activity opens its dialog, a ready workout opens the editor, a raw/skipped
workout opens its process dialog — instead of bouncing to the calendar.
