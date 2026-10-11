> Tasks: 6 completed, 0 deferred

# Tasks

## 1. Import

- [x] 1.1 `parseBackup`: format, version and shape validation; newer schema
      refused before any local read.
- [x] 1.2 `importBackup`: local snapshot, merge with the policy-filtered file,
      default-profile reconcile, import and nutrition merge in one read-write
      transaction; a summary of added, updated and not restored rows.
- [x] 1.3 AI providers keep this device's key; a provider only the file has
      is stored keyless, shown as missing its key and never offered to an AI
      feature.

## 2. Surface

- [x] 2.1 Settings → Privacy "Import backup", the profile picker for a file
      with several profiles, the summary and the nutrition warning.
- [x] 2.2 e2e: export in one clean browser and import into another; import
      over a browser with its own records; delete after the backup, then
      import.
- [x] 2.3 `verify:prod` `backup-import`: control, round trip into a clean
      browser read from IndexedDB, and a delete after the backup that holds.
