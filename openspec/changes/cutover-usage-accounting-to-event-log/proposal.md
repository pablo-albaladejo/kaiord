# Proposal: Cut usage accounting over to the event log (retire the legacy `usage` table)

## Why

#899 shipped the `usageEvents` event log, wired every AI run to it, and proved —
via a dual-write and a parity test — that folding the log reproduces the legacy
monthly `usage` row exactly. That was the "prove it is safe" half. This change
is the cutover: make the event log the **single, synced source of truth** and
delete the legacy path entirely. Users are beta and warned, so there is no
backward-compatibility constraint and **no legacy code stays behind**.

Beyond removing dead weight, the cutover **fixes a latent correctness bug**: the
old `usage` table was in `TIMESTAMPLESS_TABLES`, so the cloud-sync merge kept the
whole table from whichever device exported last — one device's usage silently
overwrote the other's. The event log is append-only with unique ids, so the same
generic merge unions per-run rows across devices (last-write-wins per id,
tombstone-suppressed). Cross-device usage becomes correct for the first time, and
the panel finally reflects **all** consumption (generation, batch, lab, chat), not
just chat.

## What Changes

- **`usageEvents` becomes synced (cross-device)**: removed from the snapshot
  `DEVICE_LOCAL` set. No merge-code change is needed — the generic
  `mergeSnapshots` already unions id-keyed rows by their `createdAt` clock and
  suppresses tombstoned ids; `usageEvents` (uuid `id`, `createdAt`) drops into
  that path as append-only union.
- **Delete the legacy `usage` path, no compat shim**: the `usage` Dexie store
  (dropped in a v33 migration), the `UsageRepository` port and its Dexie +
  in-memory adapters, `recordChatUsage` (+test), the transitional
  `recordTurnUsage` dual-writer (+test) and the `usage-parity.test.ts` gate, the
  `UsageRecord`/`UsageEntry` schemas (`types/usage-schemas.ts`, +test), and the
  `usage` entries in `TIMESTAMPLESS_TABLES` / `PRIMARY_KEYS`.
- **Chat writes the log directly**: `appendAssistantTurn` calls `appendUsageEvent`
  with `purpose: "chat"` (no dual-write, no `recordChatUsage`). One write path
  for every purpose.
- **v33 migration**: fold each existing `usage.entries[]` row into a
  `usageEvents` row (`purpose: "chat"`, cost carried over) so users keep their
  visible history, then drop the `usage` store. Additive-then-drop; the new
  rows are valid, tombstonable, and sync like any other event.
- **Panel reads the fold**: `UsageTab`/`UsageTable` read `usageEvents` over the
  6-month window and fold per month via `foldUsageEvents`, rendering per-month
  totals plus a **per-purpose breakdown** (the log carries `purpose`/`modelId`).
  The legacy `legacy`/"—" output handling is removed (no legacy rows exist).
- **Retention / pruning**: with the log synced and unbounded, a
  `pruneUsageEvents` use-case deletes events older than a retention window
  (12 months) through a tombstoning `delete(id)` on `UsageEventRepository`, so
  the delete propagates cross-device and the snapshot stays bounded. Attached to
  the sync flow so tombstones ride the next push.

## Capabilities

### Modified Capabilities

- `spa-ai-usage-telemetry`: the event log is now the **synced, authoritative**
  usage store with a single writer, cross-device append-only union semantics,
  the Settings panel reading the monthly fold with a per-purpose breakdown, and
  bounded retention via tombstoning prune. The transitional dual-write, the live
  `usage` row, and the parity gate are removed.
- `spa-ai-batch`: the "Monthly AI usage tracking" requirement is restated to
  track usage through the `usageEvents` log (folded per month) rather than the
  retired `usage` Dexie table.

## Impact

- **Packages**: `@kaiord/workout-spa-editor` only (private). No `@kaiord/ai`
  change — the telemetry port and sink are unchanged. No changeset (private).
- **Persistence**: Dexie **v33** — drops the `usage` store and migrates its
  `entries[]` into `usageEvents`. `usageEvents` moves from device-local to
  synced. No other store changes. Existing `usageEvents` rows are unaffected.
- **Cross-device**: usage now merges correctly (per-run union) instead of the
  old whole-table-last-writer-wins. `merge-record-key.ts` loses its `usage`
  special-casing; `usageEvents` uses the default id-key + `createdAt` clock.
- **Data**: no user-visible history loss — old `usage` months are migrated into
  the log. The snapshot gains per-run rows but is bounded by the 12-month prune.
- **Hexagonal layers**: net deletion. New `pruneUsageEvents` is an application
  use case over the existing port; retention deletes go through the tombstone
  decorator (add `usageEvents` to its tombstoned set). No new ports; the sink
  and `appendUsageEvent`/`foldUsageEvents` are unchanged.
- **Public API**: none (SPA-private).
- **Tests**: delete the legacy-writer/parity/usage-schema suites; add the v33
  migration test (usage → usageEvents, store dropped), the synced-merge test
  (two devices' events union cross-device), the prune/retention test (old events
  tombstoned and suppressed), and the rewritten panel tests (fold + per-purpose
  breakdown). Coverage thresholds unchanged (80/70).
- **Referenced specs**: `spa-persistence-port` (port surface shrinks by one
  repo), `spa-ai-batch` (usage-tracking requirement), `hexagonal-arch`
  (unchanged), and the cloud-sync merge behaviour (`spa-*` sync specs — the
  generic append-only union already covers the new synced table).
