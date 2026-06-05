---
"@kaiord/workout-spa-editor": patch
---

Create flows always persist and land on the calendar

The scratch editor's "Save & schedule" control now renders on every entry —
entered without a date it schedules onto today instead of leaving file export
as the only "save". After saving, both the scratch and AI create flows land on
the calendar week containing the saved workout (`/calendar/:weekId`) so the
new card is visible on arrival, replacing the previous `/workout/:id` and
dated-picker landings. The week resolution uses a local-midnight date anchor,
fixing a latent week-shift for far-east timezones at week boundaries (the
Today week strip now shares the same helper).
