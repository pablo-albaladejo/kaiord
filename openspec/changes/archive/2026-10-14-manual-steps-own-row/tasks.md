> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. Red first: a manual steps save leaves the imported daily row untouched and writes its own manual row; a re-save updates that manual row.
- [x] 2. Red first: the combined reading takes the manual steps and the imported calories, is the same in every row order, and follows a priority `sourceOrder`.
- [x] 3. Red first: the energy balance reads the imported calories and the manual steps, in either storage order.
- [x] 4. Red first: the Activity page hook, the steps history, the calendar steps badge and the chat `query_health` tool give one combined reading per day.
- [x] 5. `saveManualHealthMetric` reuses only the manual daily row; `loadDailyWellness` combines the rows for every reader; `effectiveSourceOrder` is shared with `resolveEffectiveSource`.
- [x] 6. Checked `scripts/verify-prod/checks` and the e2e specs: none depends on a manual steps entry merging into an imported row.
