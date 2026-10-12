> Tasks: 7 completed, 0 deferred

# Tasks

- [x] 1. Two-device test: a goal cleared on device A stays cleared on both devices (red first).
- [x] 2. `getById`/`delete` on `EnergyTargetRepository`, decorated by `withTombstones`; coverage guard updated.
- [x] 3. Suppress tombstoned rows by their single-field primary key in the merge and the live import; unit tests.
- [x] 4. Two-device tests: a deleted profile's rows edited or added later on a device that never saw the delete are dropped in either sync order; a profile edited after its delete comes back with its rows.
- [x] 5. Spec: why the cascade needs no per-row tombstones; correct the stale chat scenario.
- [x] 6. Interleaving tests: an intake deleted or a goal cleared between a sync's export and its import stays deleted locally and in the pushed snapshot (red first); the import drops incoming rows a live tombstone deletes and the push applies those tombstones.
- [x] 7. Spec: the older-build `energyTargets` gap after the 90-day prune; the `syncState` coverage note no longer claims a tombstone would work.
