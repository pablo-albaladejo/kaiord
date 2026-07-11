<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/dexie/`

## Purpose

The Dexie/IndexedDB implementation of `PersistencePort`. Owns the schema (v1 → v13), every per-table repository, the cascade-on-profile-delete logic, the storage probe, and the migration runner.

## Key Files

### Database + schema

- `dexie-database.ts` — `KaiordDatabase extends Dexie` class and the singleton `db`. Exposes `__KAIORD_DB__` on `window` in dev mode for E2E seeding.
- `dexie-schemas.ts` — `SCHEMAS` object with v1, v2, v4, v5, v8, v13 stores configs. v13 adds `profileId` + `[profileId+date]` index on `workouts` (workouts become profile-scoped 1–1 with cascade-on-profile-delete).
- `register-kaiord-versions.ts` — registers every version + its upgrade function on the Dexie instance.
- `dexie-migrations.ts` — shared backfill helpers (`backfillBridgeSnapshotState`, `backfillUsageRow`, `makeBackfillAiProviderCreatedAt`).
- `dexie-v{5,6,8,9,10,11,12,13}-migration.ts` — individual upgrade functions, each with a co-located test.
- `is-per-profile-table.ts` — picks up profile-scoped tables for the cascade (auto-discovery; new tables that index on `profileId` get cascaded for free).

### Per-table repositories

- `dexie-workout-repository.ts` — workouts (profile-scoped since v13).
- `dexie-template-repository.ts` — library templates.
- `dexie-profile-repository.ts` — sport profiles.
- `dexie-ai-provider-repository.ts` — AI provider configs + custom prompt meta-row.
- `dexie-sync-state-repository.ts` — per-source sync state.
- `dexie-usage-event-repository.ts` — append-only, synced per-run AI usage log (the single usage-accounting store after the v33 cutover); `listByMonth`/`listByMonths`/`listOlderThan` range-scan the `[yearMonth+purpose]` index, `delete(id)` is tombstoned for retention pruning.
- `dexie-coaching-repository.ts` — coaching activities (composite key `${profileId}:${source}:${sourceId}`).
- `dexie-coaching-sync-state-repository.ts` — per `[source+profileId]` sync state.
- `dexie-session-match-repository.ts` + `dexie-session-match-append-executed.ts` + `dexie-session-match-update.ts` — links between coaching activities and executed workouts; enforces uniqueness per `(profileId, coachingActivityId)` and `(profileId, workoutId)`.
- `dexie-auto-match-dismissal-repository.ts` — per `(profileId, weekStart)` dismissals.
- `dexie-user-preferences-repository.ts` — per-profile UI prefs (calendar density).
- `session-match-conflict.ts` — `SessionAlreadyMatchedError` mapping.
- `storage-probe.ts` — quick "is IndexedDB usable?" check for the `StorageAvailabilityBanner`.

### Composition

- `dexie-persistence-adapter.ts` — `createDexiePersistence()` factory. Wires every repository, exposes the cascade `transaction(fn)`, and handles profile-delete cascade across all per-profile tables (`is-per-profile-table`-tagged).
- `index.ts` — module export surface (factories + database singleton).

## For AI Agents

### Working In This Directory

1. **Adding a new table = new schema version.** Bump to a new vN in `dexie-schemas.ts` (don't mutate an existing version — that breaks upgrade for users on the prior version). Add a `dexie-vN-migration.ts` if any backfill is needed.
2. **Profile-scoped tables get cascade for free.** Index the new table on `profileId` and `is-per-profile-table.ts` picks it up automatically. Add a test to `is-per-profile-table.test.ts` so a future re-shape of the indexing scheme doesn't silently drop the table from the cascade.
3. **Uniqueness errors are typed.** When a write violates an index uniqueness constraint, map it to a domain error (e.g. `SessionAlreadyMatchedError`) before throwing.
4. **`transaction(fn)` is the only multi-write atom.** Per `persistence-port.ts`, application code cannot import `db` directly to open transactions — it goes through the port.
5. **Session-match writes MUST construct `coachingActivityId` via `buildCoachingActivityId(...)` / `toPersistedCoachingActivityId(...)` / `CoachingActivityRecord.id`** — enforced by `check-session-match-id-shape.mjs` (R-SessionMatchIdShape). Bare string concatenation is a CI failure.

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
