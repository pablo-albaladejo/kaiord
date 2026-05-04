<!-- opsx-ship: chunking
PR 1 (schema-snapshot):       §1 — linkedAccounts.lastSyncedZonesSnapshot + Dexie v9 + applyV9Upgrade + migration tests + v8/v9 rollback regression test. The migration RUNS at db-open (real production behavior), but no reconcile/UI logic changes are introduced — the new field stays unread and the migrated `method` values stay opaque to old reconcile. (implements D-MA2, D-MA7)
PR 2 (classifier-reconcile):  §2, §3 — classifyZoneTable helper + reconcile rewrite + commitConflictResolution method/snapshot updates. Risk: between PR 2 and PR 3 ship, ZoneEditor manual edits keep method = "custom"; the classifier's tail rule (user-customized if zones non-default but method not flagged) ensures correctness via content detection. Verified by test 2.2g. (implements D-MA1, D-MA4)
PR 3 (zone-editor-user-flag): §4 — ZoneEditor flips method = "user" on manual band edit + tests. (implements D-MA3, D-MA8)
PR 4 (dialog-grouping):       §5 — ZonesConflictDialog grouping + FTP/bands coupling + ConflictGroup component + per-group tests + e2e flow updates. (implements D-MA5, D-MA6, D-MA9)
PR 5 (e2e-flows):             §6 — Playwright flows for first-sync zero-conflicts, re-sync stability, edit-then-sync, FTP+bands coupling. Manual verification with real T2G account.
PR 6 (archive):               §7 — /opsx-archive + canonical spec sync.

PR independence:
  PR 1: independent. Touches packages/workout-spa-editor/src/types/coaching-account.ts + src/lib/profile/dexie-database.ts + src/lib/profile/dexie-migrations.ts + tests. The Dexie migration runs in production immediately; the test suite includes a regression check that v8 reconcile against a v9-migrated profile produces identical applied/conflicts as the v8-state baseline (no silent data drift on rollback).
  PR 2: depends on PR 1. Touches src/application/coaching/sync-zones-helpers.ts + src/application/coaching/zone-table-classifier.ts + src/application/coaching/zone-table-classifier-detectors.ts (new — split for the 80-line cap) + src/application/coaching/commit-conflict-resolution.ts + sync-zones-band-writes.ts + tests. Old dialog still renders linear rows but reconcile semantics are correct (first-sync produces zero conflicts).
  PR 3: depends on PR 2. Touches src/components/organisms/ZoneEditor/ + tests. Migration sweep ensures pre-existing customized profiles flip to "user" so reconcile correctly produces conflicts for them.
  PR 4: depends on PR 3. Touches src/components/organisms/ZonesConflictDialog/ + tests + e2e/zones-sync.spec.ts.
  PR 5: depends on PR 4. e2e + manual verification.
  PR 6: depends on all merged.
-->

## 1. Schema + Dexie v9 migration (implements D-MA2, D-MA7)

- [ ] 1.1 Extend `packages/workout-spa-editor/src/types/coaching-account.ts`:
  - Add `lastSyncedZonesSnapshotSchema` Zod object (15 fields per design D-MA2).
  - Extend `linkedCoachingAccountSchema` with `lastSyncedZonesSnapshot: lastSyncedZonesSnapshotSchema.optional()`.
  - Export `LastSyncedZonesSnapshot` type alias.
- [ ] 1.2 Bump `packages/workout-spa-editor/src/lib/profile/dexie-database.ts`:
  - `CORE_V8` → `CORE_V9` constant.
  - `this.version(8)` → `this.version(9)` with the `.upgrade(applyV9Upgrade)` call.
- [ ] 1.3 Add `applyV9Upgrade(tx)` to `packages/workout-spa-editor/src/lib/profile/dexie-migrations.ts` per design D-MA7:
  - Imports `import type { Transaction } from "dexie"` (TS-typed parameter).
  - For each profile, walk `sportZones.{cycling,running,swimming,generic}.{heartRateZones,powerZones,paceZones}` and:
    - Normalize `method === "manual"` → `method = "custom"`.
    - Reclassify `method === "custom"` AND `hasUserData(zones, kind)` → `method = "user"`.
  - Helper: `hasUserData(zones, kind)`:
    - HR: `zones.length === 5 AND some band has minBpm > 0 OR maxBpm > 0`.
    - Power: `zones.length >= 5 AND zones.slice(0,5)` does NOT deep-equal `calculatePowerZones("coggan-7").slice(0,5)`.
    - Pace: `zones.length === 5 AND some band has minPace > 0 OR maxPace > 0`.
  - Idempotent: running twice produces the same result.
- [ ] 1.4 Tests in `packages/workout-spa-editor/src/lib/profile/dexie-v9-migration.test.ts` (mirrors v8 pattern):
  - 1.4a Fresh-factory profile → no method changes; no snapshot added.
  - 1.4b `method = "manual"` (from prior PR 2 sync) → flips to `"custom"`.
  - 1.4c `method = "custom"` + clearly-edited HR zones (`Z1: 100-130`, etc.) → flips to `"user"`.
  - 1.4d `method = "custom"` + all-zero seed HR zones → stays `"custom"`.
  - 1.4e `method = "coggan-7"` + zones equal `calculatePowerZones("coggan-7")` → stays `"coggan-7"` (formula-derived, not user-touched).
  - 1.4f `method = "coggan-7"` + zones DIFFER from formula → flips to `"user"` (someone edited within a formula state).
  - 1.4g Idempotency: running migration twice produces same result. Includes a `method = "user"` already-present case (no second-run reclassification, no value rewrite).
  - 1.4h Generic sport: `generic.heartRateZones` with `method = "custom"` AND user-edited zones flips to `"user"` (same path as cycling/running/swimming HR — no special case for `generic`).
- [ ] 1.5 Add changeset `@kaiord/workout-spa-editor: minor`. Body summarises the schema field + migration intent.
- [ ] 1.6 Run `pnpm --filter @kaiord/workout-spa-editor test` — all existing tests SHALL stay green; new migration tests pass.
- [ ] 1.6.5 (load-bearing rollback regression test) Add `dexie-v9-rollback.test.ts` that exercises the v8/v9 rollback semantics:
  - **Fixture mechanism (pinned):** create `packages/workout-spa-editor/src/test-utils/v8-reconcile-snapshot.ts` containing a verbatim copy of the `reconcile` function and `isBandKeyInEmptyTable` helper from `sync-zones-helpers.ts` AT THE COMMIT PRIOR TO PR 1 (the post-train2go-zones-sync-full-bands-archive `main` commit, currently `f954d405`). The snapshot file has a JSDoc header `@frozen-snapshot-of sync-zones-helpers.ts@f954d405` and a guarding comment `// DO NOT EDIT — this is the v8-shipped reconcile, frozen for the v9 rollback regression test`. ESLint exemption added for `max-lines` since the snapshot mirrors a 50-line function exactly.
  - Build a v9-migrated profile shape (snapshot present, some tables flipped to `method = "user"`, a `"manual"` value normalized to `"custom"`).
  - Run the snapshotted v8 reconcile against this v9 profile.
  - Assert the `applied` and `conflicts` arrays produced match an explicit golden output (no silent overwrite of `method = "user"` tables; v8's `isTableEmpty` check returns false for populated zones, routes to per-band conflict — same path as if the table were `method = "custom"` + populated). The test SHALL pin: rollback does NOT silently lose user data.
  - Documented as the canonical rollback verification per proposal.md "Rollback semantics".
  - The frozen snapshot file is deleted in PR 6 (archive) — the rollback risk window closes once all PRs are merged and the previous `main` commit is no longer the deployable rollback target.

## 2. Zone-table classifier (implements D-MA1)

- [ ] 2.1 Create `packages/workout-spa-editor/src/application/coaching/zone-table-classifier.ts`:
  - Export `ZoneTableState = "empty" | "default-template" | "method-derived" | "train2go-synced-clean" | "train2go-synced-edited" | "user-customized"`.
  - Export `classifyZoneTable(profile, sport, kind, snapshot): ZoneTableState`.
  - Body branches per design D-MA1 detection rules. Helper functions for each detection (e.g., `isAllZeroHrSeed(zones)`, `isCogganSevenDefaults(zones)`, `matchesFormula(zones, method, threshold)`, `equalsSnapshot(zones, snapshot[kind])`).
  - File ≤ 80 lines, helpers ≤ 40 lines per function (per CLAUDE.md cap).
- [ ] 2.2 Unit tests in `zone-table-classifier.test.ts` — one test per state per sport-kind:
  - 2.2a `empty`: zones absent OR length === 0.
  - 2.2b `default-template`: HR all-zero (5 entries), pace all-zero (5 entries), power = Coggan-7 defaults (7 entries).
  - 2.2c `method-derived`: HR `karvonen-5` matches `calculateHrZones(lthr=160, "karvonen-5")`; power `coggan-7` matches `calculatePowerZones("coggan-7")`; pace `daniels-5` matches `calculatePaceZones(thresholdPace=300, "min_per_km", "daniels-5")`.
  - 2.2d `train2go-synced-clean`: method `"train2go"` AND zones === snapshot.cyclingHr (deep-equal).
  - 2.2e `train2go-synced-edited`: method `"train2go"` AND zones differ from snapshot.cyclingHr.
  - 2.2f `user-customized`: method `"user"` (regardless of zones content).
  - 2.2g Edge: method `"custom"` + zones partially edited (some zero, some non-zero) → `user-customized` (conservative: any non-default content flips out of `default-template`).

## 3. Reconcile rewrite (implements D-MA4)

- [ ] 3.1 Rewrite `packages/workout-spa-editor/src/application/coaching/sync-zones-helpers.ts` `reconcile`:
  - Remove the existing `isBandKeyInEmptyTable` heuristic. Replace with classifier-driven dispatch.
  - For each band-level FieldKey in `incoming`, group by `<sport>.<kind>` and process the table once:
    - Look up state via `classifyZoneTable(profile, sport, kind, snapshot)`.
    - State `empty | default-template | method-derived | train2go-synced-clean` → silent-replace ALL bands of that table from `incoming`. Append to `applied`. Set `method = "train2go"` on the persisted config. Update snapshot slice for that sport-kind.
    - State `train2go-synced-edited` → for each band where `persisted ≠ incoming AND persisted ≠ snapshot[band]` → conflict. Other bands silent-replace.
    - State `user-customized` → existing per-band conflict detection.
  - Threshold-scalar processing unchanged (the legacy 7 keys keep their per-key path).
- [ ] 3.2 Update `packages/workout-spa-editor/src/application/coaching/commit-conflict-resolution.ts`:
  - When applying decisions, group by `<sport>.<kind>` table.
  - For each table (per the canonical snapshot persistence rules in design D-MA4):
    - All-accept → set `method = "train2go"`; snapshot.<sportKind> := T2G's full incoming array (user accepted everything from T2G).
    - Mixed accept/reject → set `method = "user"`; snapshot.<sportKind> := **post-merge persisted zones** (accepted bands take T2G value; rejected bands keep pre-sync user value). The snapshot reflects what's PERSISTED, not the raw T2G payload — see spec scenario "Snapshot reflects only accepted bands when conflicts are resolved" for the load-bearing assertion.
    - All-reject → leave `method` and snapshot untouched (pre-call values preserved).
  - Idempotent — calling twice with the same decisions produces identical final state.
- [ ] 3.3 Update `sync-zones-band-writes.ts`:
  - Remove the `"manual"` value entirely. When syncZones writes (silent-replace path), set `method = "train2go"`.
  - Ensure no other call site emits `"manual"`.
- [ ] 3.4 Tests in `sync-zones-bands-method-aware.test.ts` (new file):
  - 3.4a First-sync against fresh profile → zero conflicts, all tables flip to `method = "train2go"`, snapshot populated.
  - 3.4b Re-sync against unchanged profile → zero conflicts, zero applied (no-op), snapshot.syncedAt updated.
  - 3.4c Method-derived (`coggan-7`) + T2G data → silent-replace; method becomes `"train2go"`; original `"coggan-7"` lost (per D-MA4).
  - 3.4d User-customized HR table + T2G differs → per-band conflicts emitted only for differing bands; method stays `"user"` post-reject-all.
  - 3.4e User edits Z2 post-T2G-sync → next sync surfaces only Z2 conflict (state `train2go-synced-edited`).
  - 3.4f Mixed accept/reject → method becomes `"user"`; snapshot reflects merged state.
  - 3.4g All-accept on a `user-customized` table → method becomes `"train2go"`; snapshot updated.

## 4. ZoneEditor user-edit signal (implements D-MA3, D-MA8)

- [ ] 4.1 Identify all manual-band-edit pathways in `packages/workout-spa-editor/src/components/organisms/ZoneEditor/`:
  - `<input>` onChange handlers for `minBpm`, `maxBpm`, `minPercent`, `maxPercent`, `minPace`, `maxPace`.
  - The aggregator that builds the final `ZoneConfig` patch before persist.
- [ ] 4.2 Add a `markZonesAsUserEdited` helper:
  - Takes a `ZoneConfig` and returns a fresh config with `method = "user"`.
  - Called from the manual-edit save handler ONLY (not from the `useMethodSwitch` formula path).
- [ ] 4.3 Update unit tests in `ZoneEditor.test.tsx`:
  - 4.3a Editing `Z2.maxBpm` flips `method` from `"train2go"` to `"user"`; zones content reflects the edit.
  - 4.3b Editing `Z2.maxBpm` flips `method` from `"custom"` to `"user"`.
  - 4.3c Method dropdown selection (`useMethodSwitch`) does NOT flip to `"user"` — keeps the dropdown's chosen value (`"karvonen-5"`, etc.).
  - 4.3d Switching from `"user"` to a formula method via dropdown sets the new method id, NOT `"user"`.
- [ ] 4.4 Verify no bypass paths:
  - `grep -rn "heartRateZones.zones\[" packages/workout-spa-editor/src/components/` should show only ZoneEditor + dialog + reconcile call sites; no other path mutates zones directly.
  - Add a `it("...should...")` test asserting the helper is called from every band-edit handler (smoke test via mocking).

## 5. Dialog grouping + FTP coupling (implements D-MA5, D-MA6)

- [ ] 5.1 Create `packages/workout-spa-editor/src/components/organisms/ZonesConflictDialog/ConflictGroup.tsx`:
  - Props: `{ groupKey: string; label: string; conflicts: ConflictItem[]; decision: ConflictDecision; onChange; expanded: boolean; onToggleExpand }`.
  - Renders summary line, per-table accept/reject radio, [▼ Detail] toggle.
  - When expanded, renders inline list of per-band rows showing `current → incoming` and `✓` markers for matching bands.
  - testid: `zones-conflict-group-<sport>-<kind>` on the group row; per-band testids preserved INSIDE the detail view.
  - File ≤ 80 lines.
- [ ] 5.2 Create `packages/workout-spa-editor/src/components/organisms/ZonesConflictDialog/group-conflicts.ts`:
  - `groupConflicts(conflicts: ConflictItem[]): { scalars: ConflictItem[]; bandGroups: BandGroup[]; ftpCoupledGroup?: CoupledGroup }`.
  - `bandGroups`: array of `{ groupKey, sport, kind, conflicts, label }` per `<sport>.<kind>` table.
  - `ftpCoupledGroup`: present when both `cycling.thresholds.ftp` AND `cycling.powerZones.*` conflicts exist; absent otherwise.
  - Pure function, ≤ 80 lines.
- [ ] 5.3 Rewrite `ZonesConflictDialog.tsx`:
  - Use `groupConflicts` to split incoming `conflicts` into scalars / band groups / coupled FTP+bands.
  - Render scalars as existing per-row (`ConflictRow`).
  - Render band groups as `ConflictGroup` instances.
  - Render coupled FTP+bands group with the special "Cycling threshold + zones" label and combined accept/reject (which emits decisions for both the FTP scalar AND all coupled band keys).
  - State: `expandedGroups: Set<string>` for which groups are open.
  - File ≤ 80 lines (helpers extracted to siblings).
- [ ] 5.4 Tests in `ZonesConflictDialog.test.tsx` (extended):
  - 5.4a 5-band cycling HR conflict renders ONE group row (NOT 10 rows).
  - 5.4b Group accept produces decisions for all conflicting bands.
  - 5.4c Group reject produces all-reject decisions for the table.
  - 5.4d FTP scalar + cycling power band conflicts render as ONE coupled group; accept produces decisions for FTP + all power bands.
  - 5.4e FTP scalar without power bands renders as standalone row (existing UI).
  - 5.4f [▼ Detail] toggle exposes per-band testids; collapsed state hides them visually but keeps DOM.
  - 5.4g Mixed scalar + band conflicts: insertion order groups scalars first, then band groups (consistent UX).
- [ ] 5.5 Update `field-labels.ts` with group labels (`"Cycling HR Zones"`, `"Cycling Power Zones"`, `"Running Pace Zones"`, `"Cycling threshold + zones"`). Pure additions; existing band-level entries retained for the detail view.
- [ ] 5.6 Update `field-labels.test.ts` count assertion: 67 (existing) + 5 group labels = 72 total.

## 6. e2e flows + manual verification

- [ ] 6.1 Extend `packages/workout-spa-editor/e2e/helpers/train2go-bridge-stub-page-script.ts` `FIXTURE_ZONES_PAYLOAD` with the full T2G shape (already-current fixture stays as a baseline; add a `FIXTURE_FRESH_FIRST_SYNC` variant for the new flow).
- [ ] 6.2 Add e2e flows in `e2e/zones-sync.spec.ts`:
  - 6.2a New flow (g) — first-sync against fresh profile produces zero conflict rows; the zones-conflict-dialog testid is NEVER present in the DOM during the flow.
  - 6.2b New flow (h) — re-sync after first-sync produces zero conflict rows AND zero applied rows (idempotent).
  - 6.2c New flow (i) — user manually edits cycling HR Z2 in Profile Manager. Between the edit and the re-sync, query the persisted profile and assert `cycling.heartRateZones.method === "user"` (the load-bearing PR 3 contract). Then trigger re-sync → dialog shows a single Cycling HR group row only (NOT individual band rows by default); user clicks `[▼ Detail]` to see per-band rows. The intermediate `method = "user"` assertion prevents the e2e from passing via the residual content-detection tail rule (which would mask a PR 3 regression).
  - 6.2d New flow (j) — FTP scalar conflict + cycling power bands → coupled group row labeled "Cycling threshold + zones"; accept produces both the FTP write AND the band write.
- [ ] 6.3 Run e2e × 3 with `--retries=0` — all green, zero retries, zero `.fixme/.skip` (per the existing PR-3 §6.3 stability gate).
- [ ] 6.4 Manual verification with Pablo's real T2G account:
  - Pre-sync: Profile Manager Cycling tab shows FTP=268, LTHR=174, HR zones 0-0 (legacy state from first shipped change).
  - Toggle on `Sync zones`, click Sync.
  - Expected: zero conflict dialog (state was `default-template` for all tables).
  - Profile Manager re-render: HR zones 107-187 across Z1-Z5; Power zones with %FTP bands; Pace zones for run/swim populated.
  - Re-sync immediately: zero conflicts (state is now `train2go-synced-clean`).
  - Edit one HR band manually, re-sync: ONE group row (Cycling HR Zones — 1 band differs); `[▼ Detail]` shows the edited Z is the only one in conflict.
  - Record results in archive's proposal.md under `## Manual verification`.

## 7. Final wiring + archive

- [ ] 7.1 Run the full validation pipeline:
  - `pnpm -r build`
  - `pnpm -r test` (expect ≥35 net new cases across §1.4 (8), §1.6.5 (1), §2.2 (7), §3.4 (7), §4.3 (4), §5.4 (7), §6.2 (4) = 38)
  - `pnpm lint:fix`
  - `pnpm test:scripts`
  - `pnpm lint:specs`
  - `npx openspec validate zones-method-aware-reconcile --strict`
- [ ] 7.2 Manual verification result recorded in archive (per §6.4).
- [ ] 7.3 Archive via `/opsx-archive zones-method-aware-reconcile` once all PRs merged on main.
