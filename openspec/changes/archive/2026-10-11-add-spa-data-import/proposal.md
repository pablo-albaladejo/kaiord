> Completed: 2026-10-11

# Proposal: Import a backup from Settings → Privacy

## Why

"Export my data" writes a `kaiord-backup` file, but nothing could read it
back (F-41, import half). A user who cleared the site data, or moved to a new
browser, had a file and no way to restore it.

## What Changes

- Settings → Privacy gains **Import backup**, next to the export. It reads
  the file, merges it into this browser and shows a summary: rows added,
  updated, and not restored because they were deleted after the backup.
- `parseBackup` validates the file: format, `version` 1, the table and
  tombstone shapes, and the nutrition rows against their record schemas.
  A file from a newer schema is refused before anything is read locally.
- `importBackup` is the export's inverse and the sync pipeline's sibling:
  `exportSnapshot(local) → mergeSnapshots(local, file) → reconcileAutoProfile
→ importSnapshot`, then the device-local rewrite, in one read-write
  transaction. `importSnapshot` replaces tables, so the merge is what keeps
  local data; the single transaction is what keeps a concurrent write from
  landing between the read and the import.
- The file goes through the backup table policy before the merge, so a
  tampered file cannot bring `syncState`, `coachingSyncState`,
  `connections`, `bridges`, an `apiKey` or an `origin: "auto"` profile.
- `meta` stays the device's own. The file's `activeProfileId` is adopted only
  when the device has no valid active profile.
- AI providers: after the merge each provider gets back the encrypted key
  this device holds for it. A provider only the file has is stored without a
  key and marked `apiKeyMissing`; the repository reads it as an empty key,
  the settings list shows "Missing key", and `useAiProvidersLive` leaves it
  out for every AI feature (the settings list opts in). Entering a key
  clears the mark.
- Nutrition (`intakeEntries`, `intakePresets`, `energyTargets`, device-local
  for sync) is merged from the file's `nutrition` by key through
  `SnapshotPort.updateDeviceLocal`, after the default profile's rows are
  re-keyed. `energyTargets` now merges by `profileId`, its primary key.

## Decisions

- **Restore merges, never replaces.** A backup restore that wiped what was
  entered after it would turn a safety net into a data-loss path.
- **A delete after the backup wins.** Tombstones suppress older rows on both
  sides, as in sync. Restoring therefore does not undo a later delete; the
  summary counts those rows as not restored.
- **Nutrition deletes come back, for now.** The nutrition stores have no
  tombstones yet, so an entry deleted after the backup reappears. The
  summary warns about it whenever the file carries nutrition. Recording
  nutrition deletes (and syncing nutrition through Drive) is the next change.
- **The default profile, as in sync.** With one profile in the file, the
  clean browser's default profile folds into it. With several, nothing is
  written and the user picks one; the import re-runs with the choice
  (Pablo's decision: ask the user). With none, nothing is reconciled and the
  default profile stays unclaimed.
- **Re-importing your own backup claims the profile.** The export writes the
  unclaimed default profile as `origin: "local"`. Re-imported into the same
  browser, the reconcile would have re-keyed the profile onto itself and
  dropped it with the rows' owner. The file calls it real, so the import
  claims it instead.
- **Keyless providers are filtered at the live hook.** Every AI surface reads
  providers through `useAiProvidersLive`, so leaving keyless rows out there
  is the one place that keeps them from chat, generation, coaching and lab
  extraction. A row-merge hook in `ROW_MERGE_HOOKS` was rejected: it would
  also run on Drive sync and resurrect keys after "Clear all API keys".

## Impact

- Specs: `spa-persistence-port` (Default local profile modified, Backup
  import added).
- Code: `packages/workout-spa-editor` only. No Dexie version bump.
