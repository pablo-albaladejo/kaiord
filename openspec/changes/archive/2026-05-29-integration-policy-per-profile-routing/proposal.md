> Completed: 2026-05-29

> Status: Draft
> Source spec: `.omc/specs/deep-dive-chrome-extension-direction-model.md`
> Source trace: `.omc/specs/deep-dive-trace-chrome-extension-direction-model.md`
> Plan: `.omc/plans/ralplan-integration-policy-per-profile-routing.md`

## Why

Kaiord has never modelled **Integration Policy** as a first-class concept. The bridge protocol has direction-aware capability strings (`read:*` / `write:*`), and the domain has metric-aware schemas (`healthExtensionPayloadSchema`, KRD), but neither side is joined by a per-profile policy record. Direction is currently materialized at the UI layer — which button you click — rather than at the data layer — what the profile says.

The causal trace converged on a single underlying gap viewed from three angles:

- **Storage leg (L1 — HIGH confidence):** `profileSchema` has no routing fields; the only per-account direction flag is `syncZones: boolean` on `LinkedCoachingAccount`, and it is Train2Go-only. No `metricRouting` field exists anywhere on `Profile`.
- **Enumeration leg (L2 — HIGH confidence):** Four fragmented inventories (`healthExtensionPayloadSchema`, `ManualHealthMetric`, `HealthKrdType`, `bridgeCapabilitySchema`) use inconsistent vocabularies and have no user-facing surface. There is no canonical list of "what kaiord manages."
- **Enforcement leg (L3 — HIGH confidence):** UI affordances are gated on bridge presence (`extensionInstalled`), never on stored user policy. `GarminPushButton` does not consult the capability set it is about to exercise.

Each lane describes one missing leg of the quadruple `(Profile × ManagedDataType × Bridge × Direction)`. The three lanes are co-required — no lane stands on its own — and all three reduce to the same mechanism: kaiord has no first-class `IntegrationPolicy` concept.

The spec and interview resolved the single critical unknown (full unified scope vs. health-only layer) by choosing **unified scope**: `syncZones` is replaced, not kept alongside; the new model covers workouts, training plan, training zones, and all health metrics under one vocabulary.

Source: `.omc/specs/deep-dive-trace-chrome-extension-direction-model.md`, Convergence / Most Likely Explanation section.

## What changes

Derived from constraints C-1..C-9 in `.omc/specs/deep-dive-chrome-extension-direction-model.md`:

- **C-1 — New `IntegrationPolicy` Dexie store and Zod schema** (`packages/workout-spa-editor/src/types/integration-policy.ts`): per-profile rows of `(profileId, dataType, bridgeId, direction, mode, enabled)`. Non-unique compound index `[profileId+dataType+direction]` (N bridges per slot) plus unique `[profileId+dataType+direction+bridgeId]`.
- **C-2 — `MANAGED_DATA_REGISTRY` as single source of truth** (`packages/core/src/domain/managed-data-type.ts`): readonly tuple of 9 `ManagedDataType` values, each entry carrying `label`, `schema`, and `capabilities: { import?: string; export?: string }`. The four existing fragmented inventories are refactored to derive from this registry. Capability tokens are opaque strings in core; a runtime SPA-side vitest assertion enforces that every token referenced by the registry is a valid `bridgeCapabilitySchema` enum value.
- **C-3 — Health-record provenance and natural-key upsert**: each of the six health Dexie stores gains `sourceBridgeId: BridgeId | 'manual'` and `externalId: string`; new unique compound index `[profileId+sourceBridgeId+externalId]` enforces inbound idempotency structurally.
- **C-4 — New `exportLedger` store** (`packages/workout-spa-editor/src/types/export-ledger.ts`): `(kaiordRecordId, destinationBridgeId, destinationExternalId, contentHash, exportedAt)` rows, unique on `[kaiordRecordId+destinationBridgeId]`. Export operation: insert-pending → POST → UPDATE; 404 on PATCH deletes the dead entry and falls through to POST.
- **C-5 — ProfileManager "Data Flows" section** (`DataFlowsSection.tsx`, `DataFlowsGroup.tsx`, `DataFlowsRow.tsx`): grouped by managed data type with Sources / Destinations subsections and add/remove affordances. `SyncZonesToggle` and `LinkedAccountsSection`'s implicit coupling are removed; `LinkedAccountsSection` retains authentication/identity only.
- **C-6 — Resolver layer**: new use cases `resolve-import-policies` and `resolve-export-policies`. `GarminPushButton` consults the export resolver; Train2Go zones auto-mount consults the import resolver. `use-train2go-supports-zones.ts` is deleted.
- **C-7 — Dexie v17 migration**: adds `integrationPolicies` + `exportLedger` stores; alters 6 health stores; backfills provenance on existing rows in 1000-row batches (idempotent resume); migrates every `syncZones=true` linked account to an enabled auto-import `IntegrationPolicy` row. `syncZones` is dropped from the Zod schema in v17; the Dexie column remains nullable as a rollback buffer and is dropped in a follow-up v18 PR (F-4).
- **C-8 — Bridge identity is `BridgeId`, not a bridge instance**: policy rows reference bridges by stable id; a row whose bridge is not currently discovered renders as disabled with a "Bridge not installed" hint rather than being deleted.
- **C-9 — `mode: 'auto'` triggers (initial scope)**: imports trigger on SPA mount per active profile per matching policy row; exports trigger on entity save. No background timer or cross-tab orchestration.

## Acceptance criteria

| #     | Criterion                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `MANAGED_DATA_REGISTRY` exists at `packages/core/src/domain/managed-data-type.ts` with an entry for each of the 9 data types listed in Goal.                                                                                                                                                                                                |
| AC-2  | A **runtime SPA-side assertion test** in `bridge-schemas.test.ts` fails if `bridgeCapabilitySchema` lacks any capability token referenced by `MANAGED_DATA_REGISTRY`. Compile-time coupling is intentionally NOT used: `@kaiord/core` must remain dependent only on `zod`, and the bridge-capability vocabulary is a SPA-layer concern.     |
| AC-3  | Dexie schema version bump adds `integrationPolicies` and `exportLedger`, alters all six health stores, and runs the migration in C-7. Round-trip a populated profile through the upgrade and confirm `syncZones=true` becomes an enabled auto-import row for `training-zones`.                                                              |
| AC-4  | `ProfileManager > Profile > Data Flows` renders the grouped-by-data-type list with sources/destinations and add/remove affordances. Adding two source rows for `weight` results in two `IntegrationPolicy` rows persisting.                                                                                                                 |
| AC-5  | `GarminPushButton` no longer references `extensionInstalled` directly; it shows iff `resolveExportPolicies(profileId, 'workout')` returns at least one enabled row whose bridge is currently discovered.                                                                                                                                    |
| AC-6  | Train2Go zones import behavior is functionally preserved: a profile that previously had `syncZones=true` continues to auto-fetch zones on SPA mount after migration, with no user-visible change in behavior.                                                                                                                               |
| AC-7  | Inbound idempotency: running the same Garmin weight import twice in a row results in zero new rows on the second run. Verified via a use-case-level integration test.                                                                                                                                                                       |
| AC-8  | Outbound idempotency: pushing a workout twice in a row results in one POST + one ledger entry; the second push hits the SKIP branch when the content hash is unchanged, or the PATCH branch if the workout was edited locally. Verified via integration test on `exportLedger`.                                                             |
| AC-9  | The export aggregation rule holds: with 3 weight rows in kaiord for a single date from 3 different sources, triggering "Push weight to Garmin" exports 3 records and creates 3 ledger entries; re-pushing same day is a 3× SKIP.                                                                                                            |
| AC-10 | A new bridge can be added with **no schema changes**: add its bridge package, its `BridgeId` constant, and (if it introduces a new data type) one new entry in `MANAGED_DATA_REGISTRY`. No edits to `IntegrationPolicy` or to `DataFlowsSection`.                                                                                           |
| AC-11 | All current `vitest` suites pass, including the new ones for the registry, the migration, the resolver use cases, and the import/export idempotency paths. `pnpm lint` is clean (per CLAUDE.md zero-warning policy).                                                                                                                        |
| AC-12 | Existing OpenSpec capabilities for `spa-bridge-protocol`, `garmin-bridge`, `train2go-bridge`, `spa-garmin-extension`, `spa-train2go-extension` are updated (or this proposal's delta added) to reference `IntegrationPolicy` as the policy authority. A new `analytics-port` delta declares the integration event names and payload shapes. |

## Non-goals

1. Expanding the bridge capability vocabulary to be more granular (e.g. `read:weight` vs `read:body`). Initial release keeps the existing tokens in `bridgeCapabilitySchema` and lets the registry handle finer-grained mapping.
2. Background scheduling infrastructure for `mode: 'auto'`. Initial automatic triggers are SPA-mount (imports) and entity-save (exports). No cron, no worker.
3. Cross-profile sharing or global defaults of integration policies.
4. A user-configurable conflict-resolution UI when N sources auto-import the same data type for the same day. Default reader rule is latest by `measuredAt` across sources; provenance is preserved per record for later refinement.
5. Bidirectional sync where exports loop back as imports. Each operation is unidirectional and tracked separately.

## Affected capabilities

| Capability               | Change   | Description                                                                                                                                                            |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spa-bridge-protocol`    | MODIFIED | Bridge manifests advertise capability tokens only; policy resolution moved to `IntegrationPolicy` resolver layer. New "Policy resolution" requirement added.           |
| `garmin-bridge`          | MODIFIED | Protocol unchanged (`write:workouts`); SPA-side `GarminPushButton` gated on `resolveExportPolicies(profileId, 'workout')` instead of `extensionInstalled`.             |
| `train2go-bridge`        | MODIFIED | Protocol unchanged (`read:training-plan` + `read:training-zones`); `syncZones` policy authority moves to `IntegrationPolicy`; auto-mount zone fetch gated on resolver. |
| `spa-garmin-extension`   | MODIFIED | SPA-side state machine no longer derives "can push" from bridge presence; push affordance gated on export resolver result.                                             |
| `spa-train2go-extension` | MODIFIED | `syncZones` toggle removed from `LinkedAccountRow`; zone-sync auto-mount gated on `resolveImportPolicies`; data flows configuration moves to Data Flows section.       |
| `analytics-port`         | MODIFIED | New events: `integration_policy.toggled`, `import_completed`, `export_completed`; new gauge `kaiord.export.ledger.size`. Payload shapes declared.                      |
