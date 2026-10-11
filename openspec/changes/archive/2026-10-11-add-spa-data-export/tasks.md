> Tasks: 5 completed, 0 deferred

# Tasks

## 1. File

- [x] 1.1 Backup table policy over every table, with a coverage guard over
      the live Dexie schema and a check that no device-local table is routed
      through the snapshot.
- [x] 1.2 `exportBackup`: `exportSnapshot` + policy + nutrition through the
      repositories, in one read transaction; `listByProfile` on intake entries.
- [x] 1.3 The unclaimed default profile is written as real in the file only;
      `claimAutoProfiles` removed.

## 2. Surface

- [x] 2.1 Settings → Privacy "Export my data" with the unencrypted-file hint.
- [x] 2.2 e2e from a clean browser and the `verify:prod` `export` check: the
      file carries the workout and the intake, and no `apiKey`, `syncState`
      or `"origin":"auto"`.
