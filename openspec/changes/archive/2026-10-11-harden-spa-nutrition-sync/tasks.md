> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. Watch the nutrition stores in the auto-push token (v37 `updatedAt` indexes); test that logging an intake, saving a preset and editing the goal request a push.
- [x] 2. Keep live rows written after the sync's export read; deterministic interleaving tests for a new and an edited intake.
- [x] 3. Drop the rows of tombstoned profiles after the reconcile in sync and backup import; two-device test that a deleted profile's intake and wellness rows are neither restored nor pushed, and that a profile not yet arrived keeps its rows.
- [x] 4. Apply the same filter on the backup export.
- [x] 5. Empty `nutrition` stub in version 2 backups, ignored by the parser.
- [x] 6. Comments and spec gaps (clock skew, tombstone retention).
