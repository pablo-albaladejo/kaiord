> Tasks: 4 completed, 0 deferred

# Tasks

- [x] 1. Interleaving test: a profile deleted between a sync's export and its import leaves neither its rows in the database nor in the pushed snapshot (red first).
- [x] 2. `suppressLiveDeletes` drops the rows of profiles a live tombstone deletes; the import and the push both apply it.
- [x] 3. Interleaving tests for an intake and a goal assert the pushed snapshot carries their tombstone; the race helper moves to `test-utils/` and fires after the export.
- [x] 4. Spec: the mid-sync profile delete scenario.
