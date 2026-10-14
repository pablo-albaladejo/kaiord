> Tasks: 10 completed, 0 deferred

# Tasks

- [x] 1. Red first: a manual steps save leaves the imported daily row untouched and writes its own manual row; a re-save updates that manual row.
- [x] 2. Red first: the combined reading takes the manual steps and the imported calories, is the same in every row order, and follows a priority `sourceOrder`.
- [x] 3. Red first: the energy balance reads the imported calories and the manual steps, in either storage order.
- [x] 4. Red first: the Activity page hook, the steps history, the calendar steps badge and the chat `query_health` tool give one combined reading per day.
- [x] 5. `saveManualHealthMetric` reuses only the manual daily row; `loadDailyWellness` combines the rows for every reader; `effectiveSourceOrder` is shared with `resolveEffectiveSource`.
- [x] 6. Checked `scripts/verify-prod/checks` and the e2e specs: none depends on a manual steps entry merging into an imported row.
- [x] 7. Red first: a manual daily row stores only the steps; a manual-only day predicts expenditure from BMR and the Activity page shows no calories.
- [x] 8. Red first: a legacy manual row keeps its calories when read alone and when steps are saved again.
- [x] 9. Red first: priority reads the first source whole, manual loses when unlisted, a disabled bridge is dropped, an unlisted `fit-import` stays as a fallback, and a policy change re-runs the live read.
- [x] 10. Fixtures use `fit-import`; `MANUAL_SOURCE_BRIDGE_ID` is exported once.
