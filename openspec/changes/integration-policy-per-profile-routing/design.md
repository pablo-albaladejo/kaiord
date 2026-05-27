## Context

The kaiord SPA has two Chrome extension bridges: `garmin-bridge` (pushes workouts out, capability `write:workouts`) and `train2go-bridge` (pulls coaching plans in, capabilities `read:training-plan` + `read:training-zones`). The only per-profile direction flag is `syncZones: boolean` on `LinkedCoachingAccount`, which is Train2Go-only, boolean, and undiscoverable from the SPA's capability vocabulary. Four fragmented inventories of "what kaiord manages" exist in `@kaiord/core`, `@kaiord/mcp`, and `@kaiord/workout-spa-editor` with inconsistent naming and no user-facing surface. Push affordances are gated on bridge presence (`extensionInstalled`), not on any stored user policy.

This change introduces a first-class `IntegrationPolicy` entity, a canonical `MANAGED_DATA_REGISTRY` in `@kaiord/core`, and the resolver layer that joins them, replacing all ad-hoc direction wiring.

## Goals

- Introduce `IntegrationPolicy{profileId, dataType, bridgeId, direction, mode, enabled}` as the single authority for per-profile import/export decisions.
- Consolidate four fragmented data-type inventories into `MANAGED_DATA_REGISTRY` in `@kaiord/core/domain`.
- Gate all import/export affordances through resolver use cases, not bridge-presence flags.
- Replace `syncZones: boolean` with a proper `IntegrationPolicy` row; preserve existing behavior for migrated profiles (AC-6).
- Add structural idempotency for both inbound (provenance natural-key) and outbound (export ledger) paths.
- Enable N bridges per `(profile, dataType, direction)` slot without any schema change.

## Non-Goals

1. Granular capability tokens (`read:weight` vs `read:body`) — deferred (F-1).
2. Background auto-sync scheduler — deferred (F-2).
3. Cross-profile sharing or global defaults of integration policies.
4. Conflict-resolution UI for N auto-import sources on the same day — default is latest-by-`measuredAt`; deferred (F-3).
5. Bidirectional sync where exports loop back as imports.

## Architecture

### Core entities

```text
MANAGED_DATA_REGISTRY (packages/core/src/domain/managed-data-type.ts)
  Record<ManagedDataType, { label, schema, capabilities: { import?: string; export?: string } }>
  ManagedDataType = 'workout' | 'training-plan' | 'training-zones' | 'weight'
                  | 'sleep' | 'hrv' | 'daily-wellness' | 'body-composition' | 'stress'

IntegrationPolicy (packages/workout-spa-editor/src/types/integration-policy.ts)
  { id, profileId, dataType: ManagedDataType, bridgeId: BridgeId,
    direction: 'import'|'export', mode: 'manual'|'auto', enabled: boolean, updatedAt }

ExportLedgerEntry (packages/workout-spa-editor/src/types/export-ledger.ts)
  { id, kaiordRecordId, dataType, destinationBridgeId, destinationExternalId,
    contentHash, exportedAt }
```

### Data-flow diagram

```text
Chrome extension bridges
  garmin-bridge  ──announces──▶  bridge-registry (SPA)
  train2go-bridge ─announces──▶  bridge-registry (SPA)
                                        │
                                        ▼
                              resolveImportPolicies(profileId, dataType)
                              resolveExportPolicies(profileId, dataType)
                                        │ returns IntegrationPolicy[]
                                 ┌──────┴──────┐
                                 │             │
                                 ▼             ▼
                          import use cases  export use cases
                                 │             │
                          upsertImportedRecord  recordExport
                          (natural-key upsert)  (ledger-gated POST/PATCH)
                                 │             │
                                 ▼             ▼
                          health Dexie stores  exportLedger store
                          [profileId+           [kaiordRecordId+
                           sourceBridgeId+        destinationBridgeId]
                           externalId]           (unique)
                          (unique)
```

### Resolver layer

`resolveImportPolicies(profileId, dataType): Promise<IntegrationPolicy[]>` and `resolveExportPolicies(profileId, dataType): Promise<IntegrationPolicy[]>` query the `integrationPolicies` Dexie store on the non-unique compound index `[profileId+dataType+direction]` and return all rows (enabled or disabled). Callers decide whether to filter by `enabled` and `mode` for their use case. The resolver does NOT consult bridge-discovery state — that is the caller's concern (C-8: disabled rows stay; the affordance renders them as "Bridge not installed").

## Storage

### Dexie v17 — new and altered tables

| Table                       | Index additions                                                                            | Notes                |
| --------------------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| `integrationPolicies` (NEW) | `id`, `[profileId+dataType+direction]`, `[profileId+dataType+direction+bridgeId]` (unique) | Primary policy store |
| `exportLedger` (NEW)        | `id`, `[kaiordRecordId+destinationBridgeId]` (unique)                                      | Outbound idempotency |
| `healthSleep`               | ADD `[profileId+sourceBridgeId+externalId]` (unique)                                       | Provenance           |
| `healthWeight`              | ADD `[profileId+sourceBridgeId+externalId]` (unique)                                       | Provenance           |
| `healthHrv`                 | ADD `[profileId+sourceBridgeId+externalId]` (unique)                                       | Provenance           |
| `healthDaily`               | ADD `[profileId+sourceBridgeId+externalId]` (unique)                                       | Provenance           |
| `healthBodyComposition`     | ADD `[profileId+sourceBridgeId+externalId]` (unique)                                       | Provenance           |
| `healthStress`              | ADD `[profileId+sourceBridgeId+externalId]` (unique)                                       | Provenance           |

Health stores also gain columns `sourceBridgeId: string` and `externalId: string` (both `optional()` in the Zod schema, backfilled at migration time).

## `syncZones` removal timeline

Per pre-mortem mitigation M-1.3 and plan task T-08:

- **Dexie v17 (this change):** `syncZones` is dropped from the **Zod schema** `linkedCoachingAccountSchema` immediately. All new writes and reads ignore the field. The Dexie column **remains nullable** as a one-release rollback buffer — existing rows keep their `syncZones` value, but no code reads it after the migration runs.
- **Dexie v18 (follow-up F-4):** The column is dropped entirely once telemetry confirms 100% of clients have completed v17.

This phasing means a user who downgrades within the same minor release can still read their `syncZones` value from the column, but their IntegrationPolicy rows (created by the v17 migration) govern behavior in all forward builds.

## Hash projection rule

Each `MANAGED_DATA_REGISTRY` entry carries an optional `hashProjection: (payload) => Record<string, unknown>` function (default = identity). The export use case feeds `hashProjection(payload)` into `contentHash`, not the raw payload. This insulates the content hash from additive schema evolution: adding a new optional field to a health record schema does not change the projected hash unless that field is included in the projection. Per-DataType projections are defined alongside the registry entry and tested in `managed-data-type-hash-projection.test.ts` (T-02a).

## Export idempotency protocol

For a given record `R` and destination bridge `B`:

```text
1. BEGIN TRANSACTION
   INSERT ledger row { kaiordRecordId: R.id, destinationBridgeId: B,
                       destinationExternalId: 'pending', contentHash: hash(R) }
   — the unique [kaiordRecordId+destinationBridgeId] index makes a
     concurrent insert fail → winner proceeds, loser no-ops (lost-race branch)
2. POST(R) → newExtId
3. UPDATE ledger row: destinationExternalId = newExtId
4. On POST failure → DELETE the 'pending' row (release slot for retry)
5. On lost-race (unique constraint violation at step 1) → no-op

SKIP path  (entry exists, contentHash unchanged) → return immediately
PATCH path (entry exists, contentHash changed) → PATCH(entry.destinationExternalId, R) → UPDATE ledger
404 path   (PATCH returns 404) → DELETE dead entry → fall through to POST branch above
```

Content hash uses the per-DataType `hashProjection` from the registry (T-02a).

## ADR

| Field                       | Value                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Decision**                | Introduce `IntegrationPolicy` Dexie entity + `MANAGED_DATA_REGISTRY` domain artefact; remove `syncZones`; gate all import/export affordances through resolver use cases.                                                                                                                               |
| **Drivers**                 | (1) N-bridge cardinality must scale without schema bumps. (2) Existing `syncZones=true` users must not experience behavior loss. (3) Hexagonal layering must hold — no `@kaiord/core` → `workout-spa-editor` deps.                                                                                     |
| **Alternatives considered** | See below.                                                                                                                                                                                                                                                                                             |
| **Why chosen**              | Only Option A satisfies all 12 ACs and all 5 architectural principles. Options B and C have fatal invariant violations, not merely tradeoffs.                                                                                                                                                          |
| **Consequences (positive)** | Single vocabulary across 4 previously fragmented inventories. Future bridges additive (AC-10). Idempotency structural, not procedural. Provenance queryable per-record.                                                                                                                                |
| **Consequences (negative)** | Largest single PR scope in recent archives — 6 capability deltas, Dexie major migration touching populated stores, removal of a long-standing user-facing flag. KRD health schemas gain three new optional fields (`kaiordRecordId`, `sourceBridgeId`, `externalId`) at v2.1 — additive, not breaking. |
| **Follow-ups**              | F-1 granular capability tokens, F-2 background scheduler, F-3 conflict-resolution UI, F-4 Dexie v18 column drop, F-5 write-capable health bridges.                                                                                                                                                     |

### Option A — Unified IntegrationPolicy (chosen)

New first-class Dexie entity `IntegrationPolicy{profileId, dataType, bridgeId, direction, mode, enabled}` plus `MANAGED_DATA_REGISTRY` in `@kaiord/core`. `syncZones` removed and folded in.

Pros: one vocabulary for all 9 data types; N-per-slot natively; bridge identity stable across uninstall/reinstall; future bridges plug in by registering; all 12 ACs satisfiable; single migration.

Cons: largest blast radius — 5 capability deltas, 1 Dexie version bump, 4 inventories refactored; requires backfilling provenance on existing health rows.

### Option B — Capability-driven UI + registry only (rejected)

Keep current `extensionInstalled` + capability-token-driven UI; add `MANAGED_DATA_REGISTRY` purely as documentation; leave `syncZones` in place.

**Fatal:** cannot represent "weight imports from Garmin AND from Train2Go" without per-bridge config (D-1 violated). Cannot satisfy AC-4/AC-5: no `IntegrationPolicy` means no `resolveImport/ExportPolicies`, no Data Flows UI, no idempotent export ledger. Spec Round 1 explicitly chose unified scope and Round 6 chose dual-ledger idempotency — Option B contradicts both.

### Option C — Per-bridge routing nested in `LinkedCoachingAccount` (rejected)

Extend each `LinkedCoachingAccount` row with a `routing` blob keyed by data type.

**Fatal for C-8:** `garmin-bridge` is anonymous — it does NOT authenticate, does NOT call any SSO flow, and has **no** `LinkedCoachingAccount` row. Routing for `write:workouts` therefore has nowhere to live unless the migration synthesises shadow account rows for every bridge that does not authenticate. Shadow accounts conflate authentication with policy and make "unlink Garmin" a meaningless action. C-8 explicitly fixes this: policy rows reference bridges by stable id, not by extension installation state. A bridge without an account is first-class; Option C cannot represent it without breaking the user's mental model.

## Ledger reset / disaster recovery

When a user sets up kaiord on a new machine (empty `exportLedger`), the first push of each record type produces a POST for every record in that data type — bounded by `N_records × N_destination_bridges`. On subsequent pushes the SKIP branch fires for unchanged records and the PATCH branch fires for edited ones. This is intentional: kaiord's stored state is the source of truth for exports (spec Goal, AC-9), and the ledger exists to prevent duplicate POSTs, not to prevent initial uploads. A "ledger reset" (manual Dexie clear) has the same effect as a new machine: next push uploads everything; idempotent thereafter.

The cascade-on-delete rule (M-2.1, T-13) keeps the ledger bounded: deleting a kaiord record cascades its ledger rows via `Dexie.table.hook('deleting')`. Upper bound: `sum(current row count per data type × N destination bridges)`.

## Risks

| ID  | Risk                                                                                                  | Mitigation                                                                                                                    | Owner task(s) |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------- |
| R-1 | Dexie v17 upgrade on a populated browser DB could exceed 5s and prompt the user to close the tab      | Chunked backfill in 1000-record batches; idempotent resume on retry                                                           | T-11          |
| R-2 | `syncZones` backfill assigns wrong `bridgeId` for a Train2Go account that was linked but disabled     | Migration reads `linkedAccounts[i].source === 'train2go' && syncZones === true`; profiles without active link skip backfill   | T-12          |
| R-3 | Export ledger goes stale on remote-side deletes (PATCH → 404)                                         | 404-reconcile branch deletes dead entry and falls through to POST                                                             | T-17          |
| R-4 | Long Data Flows list causes UX overload (54-row worst case)                                           | Default-collapsed empty groups + empty-state copy + disabled-row opacity + density e2e test                                   | T-21, T-24    |
| R-5 | `MANAGED_DATA_REGISTRY` in `@kaiord/core/domain` could accidentally import from `mcp` or `spa-editor` | Layering enforced by `@kaiord/core`'s `package.json` and lint rule; T-01 tests assert no outside imports in the registry file | T-01          |
| R-6 | Removing `LinkedAccountRow`'s `SyncZonesToggle` accidentally removes authentication UI                | A-7 explicit: `LinkedAccountsSection` retained for identity; RTL test asserts unlink button still present                     | T-23          |
| R-7 | Additive third-bridge test fixture could diverge from production bridge contract                      | Mock bridge is a 1-file fixture, not a separate package; advertises existing `read:weight` token                              | T-27          |
| R-8 | Adding 3 new optional fields to health schemas could be misread as a breaking KRD bump                | Documented as v2.1 additive in `docs/krd-format.md`; fields are plain `z.string().optional()`; no Zod `.transform` for sha256 | T-05          |
| R-9 | `analytics-port` capability requires a spec delta declaring new event names + payload shape           | Resolved — tracked as T-28a; 6 spec deltas in this change, not 5                                                              | T-28a         |
