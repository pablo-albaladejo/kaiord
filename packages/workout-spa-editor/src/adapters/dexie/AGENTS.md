<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/dexie/`

## Purpose

The Dexie/IndexedDB implementation of `PersistencePort`. Owns the schema (v1 → v40), every per-table repository, the cascade-on-profile-delete logic, the storage probe, and the migration runner.

## Key Files

### Database + schema

- `dexie-database.ts` — `KaiordDatabase extends Dexie` class and the singleton `db`. Exposes `__KAIORD_DB__` on `window` in dev mode for E2E seeding.
- `dexie-schemas.ts` — `SCHEMAS` object with v1, v2, v4, v5, v8, v13 stores configs. v13 adds `profileId` + `[profileId+date]` index on `workouts` (workouts become profile-scoped 1–1 with cascade-on-profile-delete).
- `register-kaiord-versions.ts` — registers the versions that carry an upgrade function, plus the head, on the Dexie instance. Schema-only versions are pruned (see "Version pruning" below).
- `dexie-migrations.ts` — shared backfill helpers (`backfillBridgeSnapshotState`, `backfillUsageRow`, `makeBackfillAiProviderCreatedAt`).
- `dexie-v{5,6,8,9,10,11,12,13}-migration.ts` — individual upgrade functions, each with a co-located test.
- `is-per-profile-table.ts` — picks up profile-scoped tables for the cascade (auto-discovery; new tables that index on `profileId` get cascaded for free).

### Per-table repositories

- `dexie-workout-repository.ts` — workouts (profile-scoped since v13).
- `dexie-template-repository.ts` — library templates.
- `dexie-profile-repository.ts` — sport profiles.
- `dexie-ai-provider-repository.ts` — AI provider configs + custom prompt meta-row.
- `dexie-sync-state-repository.ts` — per-source sync state.
- `dexie-usage-event-repository.ts` — append-only per-run AI usage log (the single usage-accounting store after the v33 cutover), device-local since v39 (out of the sync snapshot and the backup file, no Trace id); `listByMonth`/`listByMonths`/`listOlderThan` range-scan the `[yearMonth+purpose]` index, `delete(id)` serves the retention prune and writes no tombstone.
- `dexie-coaching-repository.ts` — coaching activities (composite key `${profileId}:${source}:${sourceId}`).
- `dexie-coaching-sync-state-repository.ts` — per `[source+profileId]` sync state.
- `dexie-session-match-repository.ts` + `dexie-session-match-append-executed.ts` + `dexie-session-match-update.ts` — links between coaching activities and executed workouts; enforces uniqueness per `(profileId, coachingActivityId)` and `(profileId, workoutId)`.
- `dexie-auto-match-dismissal-repository.ts` — per `(profileId, weekStart)` dismissals.
- `dexie-user-preferences-repository.ts` — per-profile UI prefs (calendar density).
- `dexie-capability-decision-repository.ts` — the v40 `capabilityDecisions` store: one row per (profile, Capability), apart from the preferences row so no older build rewriting that row can erase a decision; `dexie-v40-migration.ts` moves the old `capabilities` map off the preferences row.
- `session-match-conflict.ts` — `SessionAlreadyMatchedError` mapping.
- `storage-probe.ts` — quick "is IndexedDB usable?" check for the `StorageAvailabilityBanner`.

### Composition

- `dexie-persistence-adapter.ts` — `createDexiePersistence()` factory. Wires every repository, exposes the cascade `transaction(fn)`, and handles profile-delete cascade across all per-profile tables (`is-per-profile-table`-tagged).
- `index.ts` — module export surface (factories + database singleton).

## For AI Agents

### Working In This Directory

1. **Version pruning.** `test-utils/kaiord-schema-history.json` is the frozen record of every version ever shipped; append an entry for each new version and never edit an old one. `registerKaiordVersions` declares only the versions with an upgrade function plus the head: Dexie diffs from the installed schema, and each extra declaration costs startup time (Dexie re-parses all earlier versions per `stores()` call). Never remove or edit a version that has an upgrade function. A schema-only version may be dropped once a later kept version restates it in full; `kaiord-schema-history.test.ts` and `kaiord-schema-history-upgrade.test.ts` enforce this.
2. **Adding a new table = new schema version.** Bump to a new vN (don't mutate an existing version — that breaks upgrade for users on the prior version). Add a `dexie-vN-migration.ts` if any backfill is needed.
3. **A new version is a delta file.** Since v37, a version declares only the stores it changes, in its own file: `dexie-v37-migration.ts` exports `V37_STORES` (the three changed stores) and `applyV37Upgrade`; `register-kaiord-v38.ts` exports `V38_STORES` (the new `traces` store) and `registerV38`; `dexie-v39-migration.ts` exports an empty `V39_STORES` with a data-only `applyV39Upgrade` (strips `traceId` from `usageEvents`) and `registerV39`. Dexie carries every store the delta leaves out over from the previous declared version, so `SCHEMAS` is not restated and the previous kept version must stay declared. Register the new function last in `registerKaiordVersions`, append the version to `test-utils/kaiord-schema-history.json` (`stores` is the delta, `upgrade` whether it has an upgrade function), bump `HIGHEST_DECLARED` in `declared-verno.test.ts` and the `SCHEMA_HEAD` of the migration tests, and seed the migration's own test with the previous version's full stores (`{ ...SCHEMAS.v35, ...V37_STORES, ...V38_STORES }` for v39).
4. **Profile-scoped tables get cascade for free.** Index the new table on `profileId` and `is-per-profile-table.ts` picks it up automatically. Add a test to `is-per-profile-table.test.ts` so a future re-shape of the indexing scheme doesn't silently drop the table from the cascade.
5. **Uniqueness errors are typed.** When a write violates an index uniqueness constraint, map it to a domain error (e.g. `SessionAlreadyMatchedError`) before throwing.
6. **`transaction(fn)` is the only multi-write atom.** Per `persistence-port.ts`, application code cannot import `db` directly to open transactions — it goes through the port.
7. **Session-match writes MUST construct `coachingActivityId` via `buildCoachingActivityId(...)` / `toPersistedCoachingActivityId(...)` / `CoachingActivityRecord.id`** — enforced by `check-session-match-id-shape.mjs` (R-SessionMatchIdShape). Bare string concatenation is a CI failure.

### Testing Requirements

- Every migration has a co-located `*.test.ts` that round-trips a v(N-1) fixture through upgrade and asserts the v(N) shape.
- Repositories test the cascade path via `deleteProfileWithCascade` (see `application/profile/delete-profile.cascade.integration.test.ts`).
- `fake-indexeddb` is the test backend; do NOT use the real `indexedDB` in unit tests.

### Common Patterns

- Each repository is a closure-based factory that captures `db`, never a class.
- Cascade `deleteByProfile` is a no-op on missing rows (concurrent-delete tolerance) — matches the convention across `CoachingRepository.delete`, `SessionMatchRepository.delete*`, `AutoMatchDismissalRepository.delete`, `UserPreferencesRepository.delete`.
- The dev-mode `__KAIORD_DB__` window export is the seam E2E tests use to seed and clear the database between specs.

## Dependencies

### Internal

- `../../ports/*` (port contracts).
- `../../types/{calendar-schemas,coaching-activity-record,session-match,profile,user-preferences,usage-event-schemas,workout-library,bridge-schemas}`.

### External

- `dexie`, `dexie-react-hooks`.

<!-- MANUAL: -->

Dexie cascade-on-profile-delete (v13) is the most load-bearing invariant here: when a user removes a profile, every per-profile table is wiped in one transaction. Any new profile-scoped data must opt into the cascade by indexing on `profileId` — otherwise the cascade is a partial-state bug factory.
