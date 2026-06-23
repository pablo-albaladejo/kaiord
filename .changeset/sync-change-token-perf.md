---
"@kaiord/workout-spa-editor": patch
---

Cross-device sync: make the auto-push change token cheap. It previously
`toArray()`-ed every synced table and scanned every row's timestamps on each
Dexie write (O(all rows) per change). It now reads each table's row `count`
plus the max of an indexed timestamp (`updatedAt` for workouts/templates/
profiles via a new Dexie v23 index, `createdAt`/`deletedAt` elsewhere) — O(tables)
per change. In-place-edit correctness is preserved: an edit sets `updatedAt`
to now, advancing the per-table max. The v23 migration is index-only
(non-destructive, no data transform).
