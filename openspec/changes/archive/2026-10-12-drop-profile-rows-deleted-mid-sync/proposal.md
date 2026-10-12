> Completed: 2026-10-12

# Proposal: Drop the rows of a profile deleted mid-sync

## Why

A row deleted between a sync's export read and its import already stays
deleted: the import drops incoming rows a live tombstone deletes, and the
pushed snapshot carries that tombstone (`suppressLiveDeletes`). A whole
profile deleted in that window was only half covered. The profile cascade
writes no per-row tombstones, so the `profiles` tombstone suppressed the
profile row but nothing dropped its per-profile rows: the import wrote them
back as orphans and the sync pushed them, until the next sync's
`dropDeletedProfileRows` removed them again.

## What Changes

- `suppressLiveDeletes` takes the per-profile tables and runs
  `dropDeletedProfileRows` on its result, so a profile tombstone read live
  drops that profile's rows exactly as the merge step does.
- The import applies it to the rows it writes, and the push applies it to
  the snapshot it sends.
- The spec states the mid-sync profile delete and adds a scenario for it.

## Impact

- `packages/workout-spa-editor`: `suppress-live-deletes.ts`,
  `import-snapshot.ts`, `import-reconciled-snapshot.ts`.
- No Dexie schema change and no new tombstones.
