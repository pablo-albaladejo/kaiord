> Completed: 2026-05-05

## Why

The shipped `train2go-zones-sync-full-bands` change (PRs #495-498) extracts T2G's full Z1-Z5 zone bands and writes them to the persisted profile. After running it once against a real T2G account, the conflict dialog surfaced 30+ rows of "0 bpm → 148 bpm" pseudo-conflicts on a freshly-created profile. The user reported the UX as "no es para nada UX" — and they're right: the profile was newly created with the Kaiord template defaults (HR all-zero, cycling power Coggan-7) and contained zero user-customized data, yet every band surfaced as a conflict requiring per-row attention.

Root cause: the reconcile policy assumes a binary state — either the table is "empty" (silent-fill) or "user-customized" (ask before overwrite). Kaiord's reality has **five** distinct zone-table states that the reconcile must distinguish, and the existing `method` field on `ZoneConfig` already carries the load-bearing semantic but the reconcile ignores it:

```
   1. empty               zones = []                              silent-fill
   2. default-template    HR/pace: method="custom",               silent-fill
                          zones=all-zero seed
   3. method-derived      method=coggan-7|karvonen-5|daniels-5,   silent-replace
                          zones = calculate(method, threshold)    (T2G overrides)
                          (Cycling power on a fresh profile
                          starts in this state — factory seeds
                          method="coggan-7" + Coggan defaults.)
   4. user-customized     method=user, OR content-detection       conflict (current
                          tail rule (zones differ from #2/#3      shipped behavior)
                          but method not yet flagged)
   5. train2go-synced     method=train2go, zones unchanged        silent re-sync;
                          since last T2G sync                     conflict iff user
                                                                  edited since last sync
```

**Glossary note** (referenced throughout this change): `method = "user"` is a schema VALUE (the new vocabulary item written to `ZoneConfig.method`); `user-customized` is a CLASSIFIER STATE (one of the 5 above). They are related but distinct: the classifier returns `user-customized` when `method = "user"` OR when the content-detection tail rule fires (zones non-default but method not yet flagged because of the PR 2 / PR 3 ship window or any other path that mutates zones without going through the ZoneEditor save handler).

This change extends reconcile to classify each `<sport>.{heartRateZones, powerZones, paceZones}` table into one of those five states and route to the right strategy. It introduces `method = "user"` (manual edits) and `method = "train2go"` (sync writes) as new semantic values, adds a `lastSyncedZonesSnapshot` to the linked-account record so re-sync can detect "user touched bands since last sync", and re-designs the conflict dialog to group rows by sport-kind table (one collapsible row per table with [Accept] / [Keep] / [Detail ▼]) instead of the linear 50-row scroll-fest.

The Profile Manager `ZoneEditor` is updated to flip `method` to `"user"` when the user manually edits a band — the only signal that distinguishes "user touched this" from "this is still the seed". Sync writes set `method = "train2go"` so future re-syncs treat the persisted bands as authoritative-from-T2G unless the user has edited since.

## What Changes

- **5-state zone-table classifier** (`classifyZoneTable(profile, sport, kind, snapshot)`) replaces the binary `isTableEmpty` check. Reconcile uses the classifier to pick a strategy per table:
  - `empty` / `default-template` / `method-derived` → silent-replace from T2G; persist `method = "train2go"`; record snapshot.
  - `train2go-synced` AND zones === snapshot → silent re-sync (same path as silent-replace).
  - `train2go-synced` AND zones differ from snapshot → user has edited since last sync; emit per-band conflicts.
  - `user-customized` → emit per-band conflicts (existing behavior).

- **`method = "user"` semantic added to `ZoneEditor`**: when the user edits any zone band via Profile Manager, set `<sport>.<kind>.method = "user"`. Existing `"custom"` value is reserved for "template default, never user-touched". Migration script reclassifies existing profiles: `"custom"` + zones differ from defaults → `"user"`; `"custom"` + zones = defaults → stays `"custom"` (default-template state).

- **`linkedAccounts[i].lastSyncedZonesSnapshot`** field added to the schema. Stores the exact zone arrays + threshold scalars T2G returned at the most recent successful sync, with a `syncedAt` timestamp. Used by the classifier to detect post-sync edits without per-zone tracking. Dexie schema bump (v9).

- **Conflict dialog grouped by sport-kind table** (`ZonesConflictDialog`): one row per `<sport>.<kind>` table with the band-count summary (`"Cycling HR — 5 bands differ"`), per-table [Accept Train2Go] / [Keep current] radio, and [▼ Detail] expandable revealing per-band rows. Threshold-scalar conflicts (FTP, LTHR, etc.) keep the existing per-row affordance.

- **FTP scalar + cycling power band coupling**: when the FTP scalar (`cycling.thresholds.ftp`) is in conflict alongside cycling power band conflicts, the dialog SHALL group them into a single "Cycling threshold + zones" decision (same accept/reject toggle drives both). Rationale: power bands are stored as `%FTP`, derived from the persisted FTP at sync time; accepting one without the other creates display inconsistency.

- **`commitConflictResolution` updates `method` and snapshot**: per accepted band-table, set `method = "train2go"` and append to `lastSyncedZonesSnapshot`. Per rejected band-table, leave `method` and snapshot alone.

- **`sync-zones-band-writes.ts` `"manual"` value normalized** — the value I introduced in PR 2 doesn't fit the existing convention. Sync writes now use `"train2go"` (when called from sync) or preserve the existing method (when called from a partial fallback). The migration sweeps any `"manual"` → `"custom"` so the post-migration profile has a consistent vocabulary.

- **Existing canonical specs updated**: the shipped `train2go-zones-sync` spec gets a MODIFIED Requirement reflecting the new conflict policy, and ADDED Requirements for the classifier and the snapshot field. The shipped `spa-train2go-extension` spec is unchanged at the bridge layer (payload shape stays the same).

## Capabilities

### New Capabilities

- (none — extends existing `train2go-zones-sync`)

### Modified Capabilities

- `train2go-zones-sync`: classifier-driven reconcile strategy; snapshot field on linked account; FTP+bands coupling; dialog grouping; ZoneEditor user-edit semantic.

## Impact

**Affected packages:**

- `@kaiord/workout-spa-editor` — schema (Dexie v9 migration), reconcile, ZoneEditor, ZonesConflictDialog, types/coaching-zones, types/profile, types/coaching-account.
- (no bridge changes — payload shape is unchanged)

**Privacy / store impact:** none. The snapshot stores zone bands the user already opted into syncing — same surface as today's persisted profile. No new fields read from T2G's `/user/details` page.

**Schema migration risk:** Dexie v9 bump touches every existing profile. Migration is idempotent and runs at db-open time.

Forward compatibility: previous-version code reads the new profile shape correctly because all new fields are `optional` Zod fields. The migration `applyV9Upgrade` is a separate exported helper (mirrors the v8 pattern) so the test suite can pin its behavior.

**Rollback semantics (load-bearing):** IndexedDB does NOT permit version downgrade — a "rollback" means deploying old JS bundle while the user's local DB stays at v9. Old code (pre-this-change) reading a v9-migrated profile encounters two new things: (a) `linkedAccounts[i].lastSyncedZonesSnapshot` (Zod ignores via `.optional()`, no runtime impact), and (b) `method = "user"` written by the migration on tables it conservatively reclassified. The shipped reconcile reads `method` only via `setSportThreshold`/`mergeSport` (both treat it opaquely), so `method = "user"` does NOT trigger any new reconcile path in the old code. Worst case: old reconcile sees method `"user"` + zones non-default, runs its `isTableEmpty` heuristic (returns false since length > 0), routes to per-band conflict — same behavior as today's `method = "custom"` + populated zones. **No silent data loss on rollback.** Pinned by a regression test (PR 1 §1.6.5) that runs the OLD reconcile against a freshly v9-migrated profile and asserts identical applied/conflicts as the v8-state baseline.

**Backwards compatibility:** zero break for downstream consumers of the `ZonesPayload` Zod type or the `FieldKey` union — no public-API changes. The conflict dialog's external props (`conflicts: ConflictItem[]`) are unchanged; only the internal rendering is restructured.

**Out of scope:**

- Bidirectional sync (Kaiord → T2G zone updates).
- Threshold-scalar redesign — the 7 legacy FieldKeys (`cycling.thresholds.ftp`, etc.) keep their single-row dialog affordance.
- Tolerance for "near-equal" bands (e.g., ±1% on power bands): the spec keeps integer-equality after the fix; UX grouping reduces the noise without weakening the contract. Tolerance is tracked as a separate idea (Q1 in design.md Open Questions) but not in this change.
- Multiple linked T2G accounts (`linkedAccounts.length > 1`): the snapshot field is per-account, so the architecture supports it, but the UX flows are designed for a single account; multi-account UX is a separate change.
