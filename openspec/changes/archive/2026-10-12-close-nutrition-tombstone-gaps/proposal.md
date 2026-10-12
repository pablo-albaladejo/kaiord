> Completed: 2026-10-12

# Proposal: Close the nutrition sync tombstone gaps

## Why

Nutrition sync left two delete paths unverified:

- `energyTargets` had no tombstones. Its primary key is `profileId`, it had
  no single-row delete, and the merge only suppressed rows with a string
  `id`. A goal cleared on one device would come back from another device's
  copy on the next sync.
- The profile cascade writes no per-row tombstones. `dropDeletedProfileRows`
  is meant to carry the delete across devices through the `profiles`
  tombstone, but no test covered a device that never saw the delete and
  then edits or adds a row of that profile.

## What Changes

- `EnergyTargetRepository` gains `getById(profileId)` and `delete(profileId)`,
  and `withTombstones` decorates it: a clear writes an
  `[energyTargets+profileId]` tombstone in the same transaction.
- The merge and the sync's live import suppress a row by its single-field
  primary key (`tombstoneIdOf`), not only by `row.id`. Composite keys are
  still never suppressed.
- The profile cascade stays without per-row tombstones. Two-device tests show
  the `profiles`-tombstone drop also removes rows edited or added later on a
  device that never saw the delete, which per-row tombstones would not. The
  spec now says why, and corrects a stale chat scenario that still described
  the rows coming back as orphans.
- A row deleted while a sync sits between its export read and its import
  stays deleted: the import drops incoming rows a live tombstone deletes,
  and the pushed snapshot carries that tombstone without the row.
- The spec lists one more known gap: an older build keeps re-pushing a
  cleared goal, which comes back once its tombstone is pruned.

## Impact

- `packages/workout-spa-editor`: energy-goal repository (port, Dexie,
  in-memory), tombstone decorator, merge suppression, coverage guard.
- No Dexie schema change: the tombstone store already keys on `[table+id]`.
