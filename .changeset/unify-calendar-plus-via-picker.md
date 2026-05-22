---
"@kaiord/workout-spa-editor": minor
---

refactor: unify calendar empty-day "+" entry through `NewWorkoutPicker`. Clicking "+" now navigates to `/workout/new?date=Y-M-D` (instead of opening `EmptyDayDialog`); the picker reads `?date=`, shows a date-aware heading, and propagates the date through all three tiles (Scratch, Import, Template). The Template tile mounts `TemplatePickerDialog` inline when a date is present so one-click scheduling is preserved. Imports on a dated picker auto-tag the persisted `WorkoutRecord.date` and route to `/workout/:id`; header-entry imports keep the prior non-persisting behaviour. `RawWorkoutContent`'s "Create manually" button is renamed to "Create workout" and routes through the picker (`/workout/new?date=…`). `EmptyDayDialog`, `EmptyDayChoices`, and their tests are deleted.
