# Tasks: cutover-usage-accounting-to-event-log

Delete-heavy. Ordered so each section leaves `pnpm -r test && pnpm -r build &&
pnpm lint` green. No legacy `usage` code survives.

## 1. Make `usageEvents` synced (cross-device)

- [ ] 1.1 Remove `"usageEvents"` from the `DEVICE_LOCAL` set in
      `adapters/dexie/dexie-snapshot-port.ts` (and its comment); update the
      snapshot-port test that asserted it was excluded → now included.
- [ ] 1.2 In `application/sync/merge-record-key.ts` remove `usage` from
      `TIMESTAMPLESS_TABLES` and from `PRIMARY_KEYS` (store is being dropped).
      `usageEvents` needs no entry (defaults to `[id]` key + `createdAt` clock).
- [ ] 1.3 Add a merge test: two devices each with distinct `usageEvents` rows in
      the same month union cross-device (both kept, deduped by id); a tombstoned
      id is suppressed.

## 2. Dexie v33 — migrate then drop `usage`

- [ ] 2.1 Add v33 in `register-kaiord-versions-v10-plus.ts`: `.upgrade` folds
      each `usage` row's `entries[]` into `usageEvents` (one row per entry:
      `purpose:"chat"`, no `providerType`, `cost`/`date` carried, id
      `usage-migrated:<yearMonth>:<i>`), then `db.version(33).stores({ ...v32,
    usage: null })` drops the store. Schema builder `buildCoreV33` in
      `dexie-schemas-late.ts` composed into `dexie-schemas.ts`.
- [ ] 2.2 `dexie-v33-migration.test.ts`: seed a v32 db with a `usage` row (2
      entries) + existing `usageEvents`; open at head → `usage` store gone, 2
      migrated `chat` events present with correct cost, prior `usageEvents`
      intact; re-open is idempotent.
- [ ] 2.3 Bump `SCHEMA_HEAD` 32 → 33 in every migration/snapshot test that pins
      it. Update `dexie-v32-migration.test.ts`, `dexie-persistence-adapter.test.ts`,
      and `dexie-usage-migration.test.ts` (which tests the historical
      `backfillUsageRow`): opening at head now drops `usage`, so assert the
      backfilled/seeded usage data lands in `usageEvents` as migrated `chat`
      events instead of in the `usage` store. KEEP the historical `backfillUsageRow`
      migration itself (frozen upgrade history for old→v33 upgraders); v33 folds
      its output into `usageEvents` before dropping the store.

## 3. Delete the legacy `usage` path (no shim)

- [ ] 3.1 Delete files: `application/chat/record-chat-usage.ts` + its test,
      `application/chat/record-turn-usage.ts` (NO test file exists),
      `application/usage/usage-parity.test.ts`, `types/usage-schemas.ts` + its
      test, `adapters/dexie/dexie-usage-repository.ts` (NO test file exists),
      `test-utils/in-memory-usage-repository.ts`. (`record-turn-usage.test.ts`
      and `dexie-usage-repository.test.ts` do NOT exist — do not try to delete.)
- [ ] 3.2 Remove `UsageRepository` from `ports/simple-repositories.ts` and the
      `UsageRepositories` type (keep `UsageEventRepository`; `usageEvents` is the
      only member now — collapse or rename to `UsageEventRepositories`).
- [ ] 3.3 Remove `usage` wiring from `adapters/dexie/dexie-persistence-adapter.ts`,
      `test-utils/in-memory-persistence.ts`, and the `usage` map from
      `test-utils/in-memory-persistence-snapshot.ts` (`Stores`, capture). Fix the
      `dexie-persistence-adapter.test.ts` / `in-memory-persistence.test.ts`
      assertions that referenced `usage`.

## 4. Chat single write path

- [ ] 4.1 `application/chat/append-turn-messages.ts`: replace the
      `recordTurnUsage` call with a direct `appendUsageEvent(persistence, {
    purpose:"chat", providerType, promptTokens, completionTokens })` (kept
      best-effort — the log is now authoritative but a write must still not break
      a committed turn). Update `append-turn-messages.test.ts`.

## 5. Retention / pruning

- [ ] 5.1 `UsageEventRepository`: add `getById(id)` and `delete(id)`; implement in
      the Dexie + in-memory adapters. Add `"usageEvents"` to `TOMBSTONED_TABLES`
      in `adapters/with-tombstones.ts` so a delete records a `[usageEvents+id]`
      tombstone.
- [ ] 5.2 `application/usage/prune-usage-events.ts`: `pruneUsageEvents(port, {
    now, retentionMonths = 12 })` — computes the cutoff yearMonth, lists events
      older than it, deletes each by id (tombstoned). Unit test: old events
      deleted + tombstoned, in-window events kept, empty log no-ops.
- [ ] 5.3 Invoke the prune from the existing `db.on("ready")` maintenance hook —
      add it to `adapters/dexie/dexie-junk-cleanup.ts` (`runJunkCleanupOnce`),
      which already runs once per session and swallows errors. The tombstones it
      writes ride the next sync push. Extend the junk-cleanup test.

## 6. Panel reads the fold + per-purpose breakdown

- [ ] 6.1 `UsageEventRepository.listByMonths(yearMonths[])` (range read) for the
      window; Dexie + in-memory impls + test.
- [ ] 6.2 Rewrite `components/organisms/SettingsPanel/UsageTab.tsx` to read
      `usageEvents` for the 6-month window and fold per month (`foldUsageEvents`),
      producing per-month totals + a per-purpose sub-total map.
- [ ] 6.3 Rewrite `UsageTable.tsx` to render per-month totals + the per-purpose
      breakdown; delete the `legacy`/"—" handling and the `usage.footnoteBefore`
      / `usage.footnoteAfter` i18n keys (en/es). Add `usage.purpose.*` keys.
      Rewrite `UsageTab.test.tsx` / `UsageTable.test.tsx` to seed `usageEvents`
      and assert folded rows + breakdown. Keep `UsageEmptyState`.

## 7. Wire-up, guards, verify

- [ ] 7.1 `pnpm -r test && pnpm -r build && pnpm lint` green; fix zero-warning
      violations (line caps, R-ItBodyAAA, R-PIIInterpolation on any new
      toast/console, R-DexieImport/write-through) in touched files. Confirm no
      dangling reference to `usage` / `UsageRecord` / `recordChatUsage` remains
      (`grep`).
- [ ] 7.2 `pnpm lint:specs` green; `npx openspec validate --strict
    cutover-usage-accounting-to-event-log` green.
- [ ] 7.3 `/opsx:verify` against the modified spec scenarios; then PR.
