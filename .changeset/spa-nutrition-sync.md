---
"@kaiord/workout-spa-editor": minor
---

Nutrition syncs with Google Drive: the intake log, intake presets and nutrition goal now travel in the cloud snapshot and the backup file, with an `updatedAt` clock (backfilled by Dexie v37) and delete tombstones, so a deleted intake stays deleted on every device and after importing an older backup. Logging nutrition now triggers the automatic Drive push, an entry logged while a sync is running is no longer lost, and a deleted profile's records no longer come back from Drive or appear in an exported backup. Backups move to version 2; version 1 files still import.
