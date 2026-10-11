> Tasks: 9 completed, 0 deferred

# Tasks

## 1. Sync

- [x] 1.1 `updatedAt` on intake entries and presets, stamped by every writer;
      Dexie v37 backfill with a migration test.
- [x] 1.2 Nutrition tables leave `DEVICE_LOCAL`; `connections` is the only
      device-local re-key table.
- [x] 1.3 Intake entry and preset deletes tombstoned (`getById`, coverage
      guard); `energyTargets` classified as untombstonable.
- [x] 1.4 Mixed-version gate: a snapshot without nutrition merged with one
      that has it keeps the remote rows, and an old build pushes them back.
- [x] 1.5 Two-device tests: create, delete, newest edit wins, delete then an
      older backup import.

## 2. Backup

- [x] 2.1 Backup `version: 2` with nutrition in `tables`; `version: 1` files
      folded with a backfilled clock.
- [x] 2.2 Import summary without the nutrition warning.
- [x] 2.3 e2e and `verify:prod` updated for the v2 file, plus a nutrition
      delete that survives importing an older backup.

## 3. Copy

- [x] 3.1 Sync privacy notice names health and nutrition data (en/es).
