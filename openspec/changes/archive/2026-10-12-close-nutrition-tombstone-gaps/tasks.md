> Tasks: 5 completed, 0 deferred

# Tasks

- [x] 1. Two-device test: a goal cleared on device A stays cleared on both devices (red first).
- [x] 2. `getById`/`delete` on `EnergyTargetRepository`, decorated by `withTombstones`; coverage guard updated.
- [x] 3. Suppress tombstoned rows by their single-field primary key in the merge and the live import; unit tests.
- [x] 4. Two-device tests: a deleted profile's rows edited or added later on a device that never saw the delete are dropped in either sync order; a profile edited after its delete comes back with its rows.
- [x] 5. Spec: why the cascade needs no per-row tombstones; correct the stale chat scenario.
