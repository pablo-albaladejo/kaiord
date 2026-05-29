<!-- opsx-ship: chunking
PR 0 (openspec):          §0  (T-29, T-28a — scaffolding; merges first; pnpm lint:specs + openspec validate are blocking gates)
PR 1 (core-registry):     §1
PR 2 (domain-schemas):    §2
PR 3 (dexie-migration):   §3
PR 4 (use-cases):         §4
PR 5 (resolver-rewiring): §5
PR 6 (data-flows-ui):     §6
PR 7 (tests-e2e+verify):  §7, §8
-->

## §0 OpenSpec Scaffolding (PR 0)

- [x] **T-29** OpenSpec scaffolding: `proposal.md`, `design.md`, `tasks.md` and 5 spec deltas (`spa-bridge-protocol`, `garmin-bridge`, `train2go-bridge`, `spa-garmin-extension`, `spa-train2go-extension`)
  - Files: `openspec/changes/integration-policy-per-profile-routing/proposal.md`, `design.md`, `tasks.md`, `specs/spa-bridge-protocol/spec.md`, `specs/garmin-bridge/spec.md`, `specs/train2go-bridge/spec.md`, `specs/spa-garmin-extension/spec.md`, `specs/spa-train2go-extension/spec.md`
  - Tests: gate — `pnpm lint:specs` + `npx openspec validate integration-policy-per-profile-routing` both green
  - AC: AC-12
  - Depends: —

- [x] **T-28a** Add `analytics-port` capability spec delta declaring new event names + payload shape contract (closes R-9)
  - Files: `openspec/changes/integration-policy-per-profile-routing/specs/analytics-port/spec.md`
  - Tests: gate — `pnpm lint:specs` green; `npx openspec validate integration-policy-per-profile-routing` recognises 6 spec deltas
  - AC: AC-12
  - Depends: —

## §1 Domain Registry (PR 1)

- [x] **T-01** Add `MANAGED_DATA_REGISTRY` + `ManagedDataType` to `@kaiord/core` (capability tokens are opaque `string`, NOT `BridgeCapability`/Zod-enum types — `@kaiord/core`'s only runtime dep is `zod`; pulling `bridgeCapabilitySchema` into core would invert the SPA→core dependency arrow)
  - Files: `packages/core/src/domain/managed-data-type.ts` (NEW), `packages/core/src/domain/managed-data-type.test.ts` (NEW), barrel export
  - Tests: unit — registry has 9 entries; each entry has `label`, `schema`, `capabilities: { import?: string; export?: string }`; tuple is readonly
  - AC: AC-1, AC-10
  - Depends: —

- [x] **T-02** Add canonical-JSON + content-hash helpers to `@kaiord/core`
  - Files: `packages/core/src/domain/hash/canonical-json.ts` (NEW), `packages/core/src/domain/hash/content-hash.ts` (NEW) + sibling tests
  - Tests: unit — sorted-key stability, value-equality across key orders, sha256 deterministic
  - AC: AC-8, AC-9
  - Depends: T-01

- [x] **T-02a** Add optional `hashProjection: (payload) => Record<string, unknown>` field to each `MANAGED_DATA_REGISTRY` entry (default = identity). `record-export.use-case.ts` uses `hashProjection(payload)` as input to `contentHash`
  - Files: `packages/core/src/domain/managed-data-type.ts` (extended), `packages/core/src/domain/managed-data-type-hash-projection.test.ts` (NEW)
  - Tests: unit — adding a new optional Zod field to one of the 9 schemas leaves `hashProjection(payload)` stable for unchanged business fields; identity-default projection equals full payload
  - AC: AC-8
  - Depends: T-01, T-02

- [x] **T-03** Add SPA-side runtime vitest assertion that every capability token referenced by `MANAGED_DATA_REGISTRY` is a valid `bridgeCapabilitySchema` enum value
  - Files: `packages/workout-spa-editor/src/types/bridge-schemas.test.ts` (extended)
  - Tests: unit — `for (const entry of MANAGED_DATA_REGISTRY) { for (const token of entry.capabilities) { expect(() => bridgeCapabilitySchema.parse(token)).not.toThrow(); } }`
  - AC: AC-2
  - Depends: T-01

- [x] **T-04** Derive `healthExtensionPayloadSchema`, `ManualHealthMetric`, `HealthKrdType` from registry
  - Files: `packages/core/src/domain/schemas/health/index.ts`, `packages/workout-spa-editor/src/application/health/manual-health-metric.ts`, `packages/mcp/src/tools/health/health-record-filters.ts` (+ tests)
  - Tests: unit — each derived inventory enumerates exactly the registry's `ManagedDataType` set
  - AC: AC-2
  - Depends: T-01

## §2 Domain Schemas (PR 2)

- [x] **T-05** Add `kaiordRecordId`, `sourceBridgeId`, `externalId` as plain `z.string().optional()` on each of 6 health record domain schemas. No `.transform`-based sha256 computation — `externalId` computed by dedicated ingest mapper
  - Files: `packages/core/src/domain/schemas/health/sleep.ts`, `weight.ts`, `hrv.ts`, `daily.ts`, `body-composition.ts`, `stress.ts`; `packages/core/src/domain/hash/external-id.ts` (NEW); `packages/core/src/domain/hash/external-id.test.ts` (NEW)
  - Tests: unit — schemas accept new optional fields; ingest mapper produces deterministic `sha256(payload+measuredAt)` once; re-parsing an already-stamped record does NOT recompute the id
  - AC: AC-3
  - Depends: T-01, T-02

- [x] **T-06** Add `IntegrationPolicy` Zod schema + `BridgeId` type alias (`string`, per A-9)
  - Files: `packages/workout-spa-editor/src/types/integration-policy.ts` (NEW), `packages/workout-spa-editor/src/types/integration-policy.test.ts` (NEW)
  - Tests: unit — schema validates valid policy; rejects unknown `dataType`; rejects unknown `direction`/`mode`
  - AC: AC-4
  - Depends: T-01

- [x] **T-07** Add `ExportLedgerEntry` Zod schema
  - Files: `packages/workout-spa-editor/src/types/export-ledger.ts` (NEW), `packages/workout-spa-editor/src/types/export-ledger.test.ts` (NEW)
  - Tests: unit — schema shape; UUID + ISO datetime invariants; contentHash format
  - AC: AC-8, AC-9
  - Depends: T-02

- [x] **T-08** Drop `syncZones` from `linkedCoachingAccountSchema` (Zod schema only; Dexie column remains nullable in v17 as a rollback buffer per M-1.3; column dropped in follow-up v18 PR — F-4)
  - Files: `packages/workout-spa-editor/src/types/coaching-account.ts` (+ test)
  - Tests: unit — schema no longer accepts `syncZones`; existing fields preserved
  - AC: AC-6, AC-12
  - Depends: T-06

## §3 Dexie Migration (PR 3)

- [x] **T-09** Bump Dexie to v17 — adds `integrationPolicies` + `exportLedger` stores. One `dexie-vN-migration.{ts,test.ts}` pair per repo convention
  - Files: `packages/workout-spa-editor/src/adapters/dexie/dexie-schemas.ts`, `.../register-kaiord-versions-v10-plus.ts`, `.../dexie-v17-migration.ts` (NEW), `.../dexie-v17-migration.test.ts` (NEW), `.../dexie-schemas.test.ts` (extended), umbrella re-export from `.../dexie-migrations.ts`
  - Tests: integration — open at v16, upgrade to v17, both new stores reachable, indexes present
  - AC: AC-3
  - Depends: T-06, T-07

- [x] **T-10** Alter 6 health stores to add `[profileId+sourceBridgeId+externalId]` unique compound index in `dexie-v17-migration.ts`
  - Files: `.../dexie-v17-migration.ts` (extended), `.../dexie-v17-migration.test.ts` (extended)
  - Tests: integration — index exists; pre-existing rows readable post-upgrade
  - AC: AC-3, AC-7
  - Depends: T-09

- [x] **T-11** Backfill provenance on existing health rows in chunks of 1000 (idempotent resume); `externalId` computed via `@kaiord/core/domain/hash/external-id.ts`, NOT via a Zod transform
  - Files: `.../dexie-v17-migration.ts` (extended; or sibling `dexie-v17-provenance-backfill.ts` if over 100 lines), `.../dexie-v17-provenance-backfill.test.ts` (NEW)
  - Tests: integration — 5000-row seed → upgrade → all rows have `sourceBridgeId='manual'` and deterministic `externalId`; aborting halfway and reopening yields identical end state (idempotent resume, covers M-1.4)
  - AC: AC-3
  - Depends: T-10

- [x] **T-12** Migrate `syncZones=true` → `IntegrationPolicy` auto-import row. Do NOT drop Dexie column in v17 (column stays as rollback buffer; F-4 drops it in v18)
  - Files: `.../dexie-v17-migration.ts` (extended; or sibling `dexie-v17-syncZones-backfill.ts`), `.../dexie-v17-syncZones-backfill.test.ts` (NEW)
  - Tests: integration — profile with `syncZones=true` ends with exactly one policy row `{dataType:'training-zones', bridgeId:'train2go-bridge', direction:'import', mode:'auto', enabled:true}`; disabled-account case skipped without orphan policy; column still present after migration
  - AC: AC-3, AC-6
  - Depends: T-11

- [x] **T-13** Add `Dexie.table.hook('deleting')` cascade: deleting a record cascades its `exportLedger` rows
  - Files: `.../dexie-database.ts` or sibling `.../dexie-export-ledger-cascade.ts` (NEW) under 100 LoC, `.../dexie-export-ledger-cascade.test.ts` (NEW)
  - Tests: integration — delete workout → ledger rows for that workout gone; delete health record → ledger rows gone
  - AC: AC-8 (indirectly), M-2.1
  - Depends: T-09

## §4 Use Cases (PR 4)

- [x] **T-14** `resolve-import-policies.use-case.ts` + `resolve-export-policies.use-case.ts`
  - Files: `packages/workout-spa-editor/src/use-cases/integration-policy/` (NEW dir) + sibling tests
  - Tests: unit — returns only enabled rows for given `(profileId, dataType)`; honors `direction` filter; disabled rows still returned (runtime check at affordance layer)
  - AC: AC-5, AC-6
  - Depends: T-06

- [x] **T-15** `upsert-integration-policy.use-case.ts` + `delete-integration-policy.use-case.ts`
  - Files: same dir + tests
  - Tests: unit — upsert respects unique `[profileId+dataType+direction+bridgeId]` constraint; delete is no-op if row missing
  - AC: AC-4
  - Depends: T-06

- [x] **T-16** `upsert-imported-record.use-case.ts` (inbound natural-key upsert via `[profileId+sourceBridgeId+externalId]`)
  - Files: `packages/workout-spa-editor/src/use-cases/import/` (NEW dir) + test
  - Tests: integration — two consecutive imports of same `(sourceBridgeId, externalId)` payload → row count delta = 1 after first, 0 after second
  - AC: AC-7
  - Depends: T-10

- [x] **T-17** `check-export-ledger.use-case.ts` + `record-export.use-case.ts` implementing insert-pending → POST → UPDATE sequence (race-safe). 404 reconciliation: PATCH → 404 deletes dead entry and falls through to POST. Content hash uses per-DataType `hashProjection` from T-02a
  - Files: `packages/workout-spa-editor/src/use-cases/export/` (NEW dir) + sibling tests `record-export.use-case.test.ts`, `record-export-404-reconciliation.test.ts`, `record-export-concurrent-trigger.test.ts` (NEW)
  - Tests: unit — SKIP on unchanged content hash; PATCH on edit; POST on first export; 404 from PATCH → delete-then-POST; concurrent invocations on same key → exactly one POST and one ledger row
  - AC: AC-8
  - Depends: T-02, T-02a, T-07

- [x] **T-17b** Export aggregation rule (AC-9) — owner task for `weight-export-aggregation.test.ts`
  - Files: `packages/workout-spa-editor/src/use-cases/export/weight-export-aggregation.test.ts` (NEW)
  - Tests: integration — 3 weight rows in kaiord for one date from 3 different `sourceBridgeId` values → exports 3 records and creates 3 ledger entries; re-pushing same day produces 3× SKIP
  - AC: AC-9
  - Depends: T-17

## §5 Resolver Re-Wiring (PR 5)

- [x] **T-18** `GarminPushButton` consults `resolveExportPolicies(profileId, 'workout')`; no longer reads `extensionInstalled`
  - Files: `packages/workout-spa-editor/src/components/molecules/GarminPushButton/GarminPushButton.tsx`, `.../useGarminPush.ts` + tests
  - Tests: unit — button hidden when zero enabled policy rows; visible when ≥1 enabled row whose bridge is discovered; disabled with hint when row exists but bridge not installed (C-8)
  - AC: AC-5
  - Depends: T-14

- [x] **T-19** Train2Go zones auto-mount consults `resolveImportPolicies(profileId, 'training-zones')` with `mode:'auto'` filter. `use-train2go-supports-zones.ts` DELETED; callers updated
  - Files: `packages/workout-spa-editor/src/hooks/use-train2go-extension-read-zones.ts` (modified), `packages/workout-spa-editor/src/hooks/use-train2go-supports-zones.ts` (DELETED), call sites updated + tests
  - Tests: integration — profile migrated from `syncZones=true` triggers zones import once per SPA mount; deduplicates on repeated mounts; deleted-hook regression test asserts no remaining imports of `use-train2go-supports-zones`
  - AC: AC-6, C-9
  - Depends: T-14

- [x] **T-20** Workout-save event publishes export trigger consumed by `record-export.use-case.ts` for any `(profileId, dataType:'workout', direction:'export', mode:'auto')` row
  - Files: `packages/workout-spa-editor/src/use-cases/workout/save-workout.use-case.ts` (modified), `.../save-workout-export-trigger.test.ts` (NEW)
  - Tests: integration — saving a workout twice → 1 POST, 1 SKIP; no policy row → no POST emitted
  - AC: AC-8, C-9
  - Depends: T-17

## §6 Data Flows UI (PR 6)

- [x] **T-21** `DataFlowsSection` shell + per-dataType `DataFlowsGroup` (collapsible, default-collapsed when empty)
  - Files: `packages/workout-spa-editor/src/components/organisms/ProfileManager/components/DataFlowsSection.tsx` (NEW), `DataFlowsGroup.tsx` (NEW) + unit tests
  - Tests: unit (RTL) — renders one group per registry entry; empty groups collapsed; non-empty groups expanded
  - AC: AC-4, M-3.1
  - Depends: T-14, T-15

- [x] **T-22** `DataFlowsRow` + `[+ Add source]` / `[+ Add destination]` affordances
  - Files: `.../DataFlowsRow.tsx` (NEW), `.../AddPolicyDropdown.tsx` (NEW) + unit tests
  - Tests: unit (RTL) — Add affordance lists only bridges whose capability covers `MANAGED_DATA_REGISTRY[dataType].capabilities[direction]`; Add affordance empty for data types with no capable bridge (A-5)
  - AC: AC-4, AC-10
  - Depends: T-21

- [x] **T-23** Remove `SyncZonesToggle` from `LinkedAccountRow`; retain `LinkedAccountsSection` for authentication/identity only
  - Files: `.../LinkedAccountRow.tsx`, `.../LinkedAccountsSection.tsx` + tests
  - Tests: unit (RTL) — no `syncZones` UI; identity / unlink flow unchanged
  - AC: AC-6, A-7
  - Depends: T-08, T-21

## §7 Cross-Cutting (PR 7)

- [x] **T-24** Playwright e2e — Data Flows section density / collapse defaults
  - Files: `packages/workout-spa-editor/e2e/data-flows-section.spec.ts` (NEW), `.../data-flows-section-density.spec.ts` (NEW)
  - Tests: e2e — 18-row profile → collapsed visible count ≤ 6
  - AC: AC-4, M-3.5
  - Depends: T-21, T-22

- [x] **T-25** Playwright e2e — GarminPushButton resolver gating
  - Files: `packages/workout-spa-editor/e2e/garmin-push-resolver-gating.spec.ts` (NEW)
  - Tests: e2e — profile without policy → button absent; profile with enabled policy → button visible
  - AC: AC-5
  - Depends: T-18

- [x] **T-26** Playwright e2e — syncZones → IntegrationPolicy migration end-to-end
  - Files: `packages/workout-spa-editor/e2e/train2go-zones-migration.spec.ts` (NEW)
  - Tests: e2e — pre-seed v16 DB with `syncZones=true` → load app → assert auto-fetch fires once + policy row visible in Data Flows
  - AC: AC-6
  - Depends: T-12, T-19

- [x] **T-27** Additive third-bridge regression test — existing-token branch (AC-10 Option A)
  - Files: `packages/workout-spa-editor/src/types/additive-third-bridge-existing-token.test.ts` (NEW); fixture under `test-fixtures/bridges/mock-weight-bridge/`
  - Tests: unit — adding mock bridge advertising `read:weight` + one new `MANAGED_DATA_REGISTRY` entry surfaces it in `DataFlowsSection`'s Add affordance for `weight` with zero source edits outside the mock bridge dir and the registry file
  - AC: AC-10
  - Depends: T-22

- [x] **T-27a** Additive third-bridge regression test — new-token branch
  - Files: `packages/workout-spa-editor/src/types/additive-third-bridge-new-token.test.ts` (NEW); fixture under `test-fixtures/bridges/mock-meditation-bridge/`
  - Tests: unit — adding mock bridge advertising `read:meditation` (NEW token) requires exactly two edits: one new entry in `MANAGED_DATA_REGISTRY`, one new value in `bridgeCapabilitySchema`. No `IntegrationPolicy` edit, no `DataFlowsSection` edit, no resolver edit
  - AC: AC-10
  - Depends: T-22

- [x] **T-28** Telemetry: emit `integration_policy.toggled`, `import_completed`, `export_completed`, `kaiord.export.ledger.size` gauge (no PII)
  - Files: `packages/workout-spa-editor/src/use-cases/import/*`, `.../export/*`, `analytics-port` adapter tests extended
  - Tests: unit — events emit with expected names; payload shape contains `{ profileId, dataType, direction, bridgeId, durationMs, outcome }`; no payload values from biometric records (R-PIIInterpolation enforced)
  - AC: M-2.4
  - Depends: T-16, T-17

## §8 Final Verification (PR 7, final task)

- [x] **T-30** Full verification sweep: `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts && pnpm lint:specs && pnpm lint:archive && pnpm exec changeset status`
  - Files: `.changeset/integration-policy-per-profile-routing-*.md` (NEW)
  - Tests: smoke — all green; changeset declares `@kaiord/core` **minor** (registry + hash helpers are additive), `@kaiord/mcp` **minor** (`HealthKrdType` derivation from registry is a public-API change), `@kaiord/workout-spa-editor` **minor** (private but bumped for hygiene)
  - AC: AC-11, AC-12
  - Depends: all prior
