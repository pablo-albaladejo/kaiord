> Completed: 2026-10-11

# Proposal: Nutrition syncs with Drive and has tombstones

## Why

The intake log, the intake presets and the nutrition goal lived only in the
browser that wrote them (audit, journeys J-nutrition). A second device never
saw them, and the backup carried them in a side field merged by key with no
delete record, so an entry deleted after a backup came back on import (the
PR4c summary had to warn about it).

## What Changes

- `intakeEntries`, `intakePresets` and `energyTargets` leave `DEVICE_LOCAL`
  and travel in the cloud snapshot and the backup `tables`. `connections` is
  now the only device-local table and the only one re-keyed outside the
  snapshot when the default profile is absorbed.
- Intake entries and presets carry an `updatedAt` sync clock, stamped by
  every writer. Dexie v37 backfills it (entries from `loggedAt`, presets from
  `createdAt`).
- Intake entry and preset deletes record tombstones through `withTombstones`
  (`getById` added to both repositories). `energyTargets` is keyed by
  `profileId`, has no single-row delete and is only removed by the profile
  cascade, so it is classified as untombstonable; two devices holding a goal
  for one profile resolve last-write-wins on `updatedAt`.
- The backup file moves to `version: 2` with nutrition in `tables`. A
  `version: 1` file is still read: its `nutrition` field is folded into the
  tables with the clock backfilled. The import's nutrition warning is gone,
  because a delete made after the backup now holds.
- The sync privacy notice says health and nutrition data is synced.

## Mixed versions

A device on an older build exports no nutrition tables and ignores them on
import. `mergeSnapshots` unions table names, so a table missing on one side is
"no information", and `syncWithCloud` pushes the merged snapshot, never a
re-export: the old device pushes the remote nutrition back unchanged. When the
newer device's manifest wins the merge, the old app refuses the newer schema
before importing or pushing.

## Snapshot size

A year at five entries a day (1,825 entries, 30 presets, a goal, 100
tombstones) adds about 570 KiB of JSON to the snapshot (about 60 KiB
gzipped). Accepted: it grows linearly, stays well below a year of workouts,
and needs no new limit.

## Impact

- `packages/workout-spa-editor`: snapshot port, Dexie v37, tombstone
  decorator, auto-profile re-key rules, backup parse/export/import, Settings
  copy (en/es), e2e and `verify:prod` backup checks.
