> Completed: 2026-10-11

# Proposal: Close the gaps review found in nutrition sync

## Why

Review of the nutrition sync change found five ways the synced data could
still be lost, resurrected or left unpushed:

- logging an intake never armed the auto-push, because the change token only
  watched workouts, templates, profiles, providers and tombstones;
- an intake written between a sync's export read and its import transaction
  was wiped, because the import replaces tables without a natural-key hook;
- a deleted profile's per-profile rows came back from Drive, because the
  cascade writes no per-row tombstones and the merge unions them back;
- the backup export wrote those resurrected rows to the file;
- an app that reads version 1 backups called a version 2 file "not a Kaiord
  backup", because its schema requires the `nutrition` field.

## What Changes

- Dexie v37 also indexes `updatedAt` on the three nutrition stores, and the
  auto-push change token watches them.
- `importSnapshot` takes the rows the sync exported: in every table without a
  natural-key hook, a live row written after that read is kept unless the
  incoming row is newer or a tombstone deletes it.
- `dropDeletedProfileRows` runs after `reconcileAutoProfile` in the sync and
  in the backup import (replacing the nutrition-only orphan filter), and on
  the backup export: rows of a profile with a `profiles` tombstone and no
  live profile row leave every per-profile table. A profile that is merely
  absent keeps its rows.
- Version 2 backups carry an empty `nutrition` stub; the parser ignores it.
- The spec documents two remaining gaps: clock skew can let an edit beat a
  tombstone, and a device offline past the 90-day tombstone retention can
  bring old deletes back.

## Not done

The energy-goal collision is stated in the sync description, not in a sync
summary: a sync has no per-run summary surface today, so reporting it would
need a new result channel through the sync engine and a new UI.

## Impact

- `packages/workout-spa-editor`: Dexie v37 stores, auto-push token, live
  import merge, sync and backup profile filters, backup type.
