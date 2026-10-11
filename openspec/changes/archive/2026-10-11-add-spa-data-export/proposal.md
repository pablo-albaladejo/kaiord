> Completed: 2026-10-11

# Proposal: Export my data from Settings → Privacy

## Why

Every record lives in this browser only. Without Google Drive there was no
way to take a copy: clearing the site data, or losing the device, lost
everything (F-41). The privacy page said so and offered nothing but
"Clear all API keys".

## What Changes

- Settings → Privacy gains **Export my data**. It downloads
  `kaiord-backup-YYYY-MM-DD.json`: `{format: "kaiord-backup", version: 1,
manifest, tables, tombstones, nutrition}`, plain JSON, not encrypted; the
  hint says so and that API keys are left out.
- `exportBackup` reuses `exportSnapshot` and filters its tables through a
  backup table policy (`application/backup/backup-table-policy.ts`) that
  classifies every table of the schema:
  - **include**: the user's records, as in the sync snapshot;
  - **exclude**: `syncState` and `coachingSyncState` (integration cursors:
    restoring them would skip syncs), `connections` (bridge linkage and
    credentials of this device), `bridges` (legacy device state) and
    `tombstones` as a table (they travel in the file's `tombstones` field);
  - **rewritten**: `aiProviders` without the `apiKey` field (removed, not
    emptied: the key is encrypted with a passphrase in the bundle), and
    `profiles` with an unclaimed default profile written as `origin: "local"`;
  - **repository**: `intakeEntries`, `intakePresets` and `energyTargets`,
    which never ride the snapshot, are read per profile through their
    repositories (`IntakeEntryRepository.listByProfile` is new).
    An unclassified table is dropped, and a guard over the live Dexie schema
    fails until it is classified.
- The snapshot and the nutrition reads share one read transaction.

## Decision: the export does not claim the default profile

The plan offered two ways to keep `origin: "auto"` out of the file: claim
the local profile before serializing (`claimAutoProfiles`, shipped unused by
the default-profile change), or export it still marked `auto` and let the
importing device reconcile it.

Neither is taken:

- Claiming would turn the local profile into a real, syncable one as a side
  effect of a read. If the user then connects a Drive that already holds a
  profile from another device, sync no longer folds this device into it: they
  end up with two real profiles and their data split between them.
- Exporting `auto` would put an inert profile in a file meant for another
  device, against the invariant that no backup or push carries one.

Instead the file alone carries the profile as `origin: "local"`. The local
profile stays unclaimed and sync-inert; the importing device sees a real
profile. `claimAutoProfiles` is removed, and the requirement that listed the
backup export among the claims is amended.

## Impact

- Specs: `spa-persistence-port` (one modified, one added requirement).
- Code: `packages/workout-spa-editor` only. No Dexie version bump.
- The import half (restore from a file) is a later change.
