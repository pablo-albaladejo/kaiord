---
"@kaiord/workout-spa-editor": minor
---

Method-aware reconcile + classifier (PR 2 of 6 of `zones-method-aware-reconcile`).

**Behaviour change:** the conflict dialog no longer surfaces 30+ pseudo-conflict rows on a freshly-created profile's first sync. Tables on the seed/template/method-derived path are silent-replaced; only genuinely user-customized tables produce per-band conflicts.

**Changes:**

- New `classifyZoneTable(profile, sport, kind, snapshot)` returns one of six canonical states (`empty`, `default-template`, `method-derived`, `train2go-synced-clean`, `train2go-synced-edited`, `user-customized`).
- `reconcile` rewritten to use the classifier. Strategy per state (per design D-MA4):
  - `empty` / `default-template` / `method-derived` / `train2go-synced-clean` → silent-replace; flip method to `"train2go"`; record snapshot.
  - `train2go-synced-edited` → per-band conflict only for bands user touched since last sync (snapshot-diff).
  - `user-customized` → per-band conflict for every disagreeing band.
- `commitConflictResolution` now updates `method` and `lastSyncedZonesSnapshot` per D-MA4: all-accept → method `"train2go"`; mixed → method `"user"`; all-reject → unchanged. Snapshot reflects post-merge persisted zones (not raw T2G).
- `sync-zones-band-writes.ts` and `sync-zones-threshold-fields.ts`: replaced fallback method `"manual"` with `"custom"` (the existing canonical vocabulary).

**Files:**

- New: `zone-table-classifier.ts`, `zone-table-classifier-types.ts`, `zone-table-classifier-detectors.ts`, `zone-table-classifier-state-helpers.ts`.
- New: `sync-zones-band-table-reconcile.ts`, `sync-zones-band-strategies.ts`, `sync-zones-partition.ts`.
- New: `sync-zones-snapshot.ts`, `sync-zones-snapshot-write.ts`.
- New: `commit-conflict-band-tables.ts`, `commit-conflict-table-apply.ts`.
- Modified: `sync-zones-helpers.ts`, `commit-conflict-resolution.ts`, `sync-zones.ts`, `sync-zones-band-writes.ts`, `sync-zones-threshold-fields.ts`.

Test coverage: 18 new cases (13 classifier states + 5 method-aware end-to-end). Total 3257 tests pass (3239 → 3257).
