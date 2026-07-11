# Design: Usage-accounting cutover to the synced event log

## Context

- #899 left the system in a proven dual-write state: `recordChatUsage` writes the
  authoritative monthly `usage` row (Dexie store `usage`, PK `yearMonth`); the
  telemetry sink + `recordTurnUsage` mirror every run into the device-local
  `usageEvents` log; `foldUsageEvents` reproduces the `usage` totals exactly
  (parity test).
- Cloud sync merge (`application/sync/merge-snapshots.ts` + `merge-record-key.ts`):
  per table, rows are merged by primary key keeping the newer `updatedAt ??
createdAt`, with tombstone suppression. `TIMESTAMPLESS_TABLES = {meta, usage}`
  are instead replaced whole from the newer-manifest side. `PRIMARY_KEYS` maps
  `usage → [yearMonth]`; unlisted tables default to `[id]`.
- The snapshot port (`dexie-snapshot-port.ts`) exports every table except the
  `DEVICE_LOCAL` set (currently includes `usageEvents`).
- Tombstones: `with-tombstones.ts` decorates id-keyed `delete(id)` on a fixed
  `TOMBSTONED_TABLES` set to record `[table+id]` deletes that propagate and
  suppress in merge.

## Goals / Non-goals

- **Goal**: retire the legacy `usage` path entirely (no compat), make
  `usageEvents` the single synced source of truth, render it in the panel with a
  per-purpose breakdown, and bound its growth with retention.
- **Non-goal**: any `@kaiord/ai` change (port/sink unchanged); a settings UI to
  configure the retention window (hardcode a sane default).

## Key decisions

### D1 — Option C: sync the full event log (user decision)

`usageEvents` moves from device-local to synced. This is not just a follow-up
box ticked — it is **more correct** than the status quo. The old `usage` table,
being in `TIMESTAMPLESS_TABLES`, merged whole-table-from-the-newer-device, so two
devices that each ran AI in the same month would keep only one device's totals.
The event log is append-only with uuid ids: the generic merge unions rows per id
(LWW by `createdAt`, tombstone-suppressed), which is the correct cross-device
aggregation. The snapshot grows one row per run; D5 bounds it.

### D2 — No merge-code change; delete the `usage` special-casing

Because `usageEvents` rows have a uuid `id` and a `createdAt`, the default merge
path (id primary key, `createdAt` clock) already gives append-only union. The
only edits to the merge layer are **removals**: drop `usage` from
`TIMESTAMPLESS_TABLES` and from `PRIMARY_KEYS` (the store is gone). Removing
`usageEvents` from `DEVICE_LOCAL` in the snapshot port makes it export/import.

### D3 — Delete the legacy path, no shim

Deleted: the `usage` store (D4), `UsageRepository` + `createDexieUsageRepository`

- `createInMemoryUsageRepository`, `recordChatUsage` (+test), `recordTurnUsage`
  (+test), `usage-parity.test.ts` (transition scaffold), `types/usage-schemas.ts`
  (`UsageRecord`/`UsageEntry`, +test), and every wiring reference in the persistence
  port, the Dexie/in-memory factories, and their snapshot `Stores` type. `chat`'s
  `appendAssistantTurn` calls `appendUsageEvent` directly with `purpose: "chat"`.

### D4 — v33 migration: migrate then drop

`db.version(33)` migrates every existing `usage` row's `entries[]` into
`usageEvents` (one row per entry: `purpose: "chat"`, `providerType` absent,
`cost`/`date` carried over, a deterministic id from `usage-migrated:<yearMonth>:<i>`
so a re-run is idempotent), then declares `usage: null` to drop the store. Users
keep their visible monthly history; the migrated rows fold identically (cost is
stored per row). Migration runs before the drop within the same upgrade.

### D5 — Retention via tombstoning prune

`UsageEventRepository` gains `delete(id)` (and `getById` for the tombstone
decorator's shape); `usageEvents` joins `TOMBSTONED_TABLES` so a delete records a
`[usageEvents+id]` tombstone in-transaction. A `pruneUsageEvents(port, { now,
retentionMonths = 12 })` use case lists events whose `yearMonth` is older than the
cutoff and deletes them by id. It is invoked from the existing `db.on("ready")`
maintenance hook (`dexie-junk-cleanup.ts` / `runJunkCleanupOnce`), which
already runs once per session and swallows its own errors — the natural home for
opportunistic cleanup. The panel window is 6 months, so 12 leaves a comfortable
buffer.

**Tombstone-per-id, not independent deterministic prune.** Both devices compute
the same cutoff, so a tombstone-free "each device drops the same old buckets"
scheme is tempting (like the profile-cascade exemption). It is rejected: a
dormant device keeps re-exporting old events every sync, so the merge re-adds
them and the synced snapshot is never actually bounded until every device has
pruned. Per-id tombstones suppress the event in merge regardless of a dormant
device (within the tombstone window), so they genuinely bound the snapshot. The
only edge — a device offline past the tombstone window resurrects an ancient
event — is low-harm (the row is >12 months old, never displayed) and self-heals
on that device's next maintenance run.

### D6 — Panel: fold + per-purpose breakdown

`UsageTab` reads `usageEvents` for the 6-month window (via a
`listByMonths`/range read) and folds each month with `foldUsageEvents`.
`UsageTable` renders per-month totals (input/output/total tokens, cost) and, per
month, a per-purpose sub-breakdown (chat / workout_generation / lab_extraction),
since the log carries `purpose`. The `legacy`/"—" output column handling is
deleted — there are no legacy rows. i18n `usage.*` keys are reused; new keys for
the purpose labels are added to `settings` en/es.

### D7 — Single write path

After the cutover there is exactly one usage write path: a model run →
`appendUsageEvent` (directly for chat; via the Dexie sink for agent runs). No
authoritative/mirror split remains, so `appendUsageEvent` no longer needs the
"same formula as the legacy writer" framing — it IS the writer. Its cost formula
(`estimateCost`/`getProviderRate`) and zero-token skip are retained.

## Risks / trade-offs

- **Snapshot growth** → bounded by D5 (12-month tombstoning prune); the panel
  only needs 6 months.
- **Migration idempotency** → deterministic migrated-row ids (D4) make a
  re-applied upgrade a no-op (bulkPut over same ids).
- **Cross-device double-count** → impossible: union is by unique id; the same run
  has one id on the device that produced it. Other devices receive it via sync,
  not re-emit it.
- **Losing per-provider cost fidelity in migrated history** → migrated chat rows
  carry the already-computed `cost` from the old entry, so folded totals match;
  only the (never-displayed) per-provider attribution of old months is absent.

## Migration / rollout

Dexie v33 migrates + drops in one upgrade; inert for the running UI beyond the
panel now reading the log. First cloud sync after upgrade unions each device's
migrated history; the prune trims anything older than 12 months. No further
follow-up — this closes the usage-accounting migration.
