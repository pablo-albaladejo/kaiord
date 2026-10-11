---
"@kaiord/workout-spa-editor": minor
---

Nutrition syncs with Google Drive: the intake log, intake presets and nutrition goal now travel in the cloud snapshot and the backup file, with an `updatedAt` clock (backfilled by Dexie v37) and delete tombstones, so a deleted intake stays deleted on every device and after importing an older backup. Backups move to version 2; version 1 files still import.
