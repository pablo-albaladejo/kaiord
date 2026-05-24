## ADDED Requirements

### Requirement: Health repositories on PersistencePort

The `PersistencePort` SHALL expose six new repositories backing the six health KRD types defined by the `health-data` capability:

- `healthSleep: HealthSleepRepository`
- `healthWeight: HealthWeightRepository`
- `healthHrv: HealthHrvRepository`
- `healthDaily: HealthDailyRepository`
- `healthBodyComposition: HealthBodyCompositionRepository`
- `healthStress: HealthStressRepository`

Each repository SHALL provide at minimum:

- `getById(id: string): Promise<TRecord | undefined>`
- `getByProfileAndDateRange(profileId: string, start: string, end: string): Promise<TRecord[]>`
- `upsertMany(records: TRecord[]): Promise<void>`
- `put(record: TRecord): Promise<void>`
- `delete(id: string): Promise<void>`
- `deleteByProfile(profileId: string): Promise<void>` — cascade delete on profile removal

The `id` field SHALL be stable across re-imports of the same source FIT message so that `upsertMany` is idempotent. Profile isolation SHALL be enforced by the repository implementation (every query takes `profileId` as a parameter), so callers cannot accidentally cross profiles.

The persisted record shape SHALL mirror the corresponding `extensions.health.<metric>` Zod payload one-to-one, plus the auxiliary fields needed by Dexie indexes: `id`, `profileId`, `date` (ISO date for index keying — for time-series metrics, the start date of the payload).

#### Scenario: Calendar-equivalent week query for sleep

- **WHEN** the Health Hub sleep page requests sleep records for profile `p1` and date range `2026-05-15`..`2026-05-22`
- **THEN** `healthSleep.getByProfileAndDateRange("p1", "2026-05-15", "2026-05-22")` returns all matching `HealthSleepRecord` rows via the `[profileId+date]` index

#### Scenario: Profile isolation on read

- **WHEN** profile `p1` and profile `p2` each have a weight measurement on date `2026-05-22`
- **THEN** `healthWeight.getByProfileAndDateRange("p1", "2026-05-22", "2026-05-22")` returns only `p1`'s measurement; `p2`'s row MUST NOT leak

#### Scenario: Upsert is idempotent

- **WHEN** `healthDaily.upsertMany` is called twice with the same set of records
- **THEN** the row count in `healthDaily` does not grow on the second call

#### Scenario: Cascade delete on profile removal

- **WHEN** profile `P` is deleted
- **THEN** every repository's `deleteByProfile("P")` is invoked and removes every row whose `profileId` matches; rows owned by other profiles are untouched

#### Scenario: Single-row delete is a no-op for missing id

- **WHEN** `healthHrv.delete(id)` is called and no row with that `id` exists
- **THEN** the call resolves successfully without raising

### Requirement: Dexie v14 migration

The `DexiePersistenceAdapter` SHALL declare schema version 14 with:

- A new `healthSleep` store keyed by `id`, with indexes `[profileId+date]` and `date`
- A new `healthWeight` store keyed by `id`, with indexes `[profileId+date]` and `date`
- A new `healthHrv` store keyed by `id`, with indexes `[profileId+date]` and `date`
- A new `healthDaily` store keyed by `id`, with indexes `[profileId+date]` and `date`
- A new `healthBodyComposition` store keyed by `id`, with indexes `[profileId+date]` and `date`
- A new `healthStress` store keyed by `id`, with indexes `[profileId+date]` and `date`
- All other tables (`workouts`, `templates`, `profiles`, `aiProviders`, `syncState`, `usage`, `meta`, `bridges`, `coachingActivities`, `coachingSyncState`, `userPreferences`, `autoMatchDismissals`, `sessionMatches`) carry their v13 schema strings unchanged.
- No `.upgrade()` data-rewrite step is required — the migration only adds empty stores. The Dexie upgrade transaction commits atomically; on failure the database remains at v13.

#### Scenario: Fresh install at v14

- **WHEN** a new browser opens the app for the first time
- **THEN** Dexie creates the database directly at v14 with the six health stores available and empty

#### Scenario: Upgrade from v13 to v14

- **WHEN** an existing user with v13 data loads a build that ships v14
- **THEN** the database upgrades, the six new health stores appear empty, every existing v13 store carries its data unchanged, and no row is rewritten

#### Scenario: Forward-tolerance of new stores on a v13 build

- **WHEN** a v14-migrated database is opened by a v13 build (rollback scenario)
- **THEN** Dexie preserves the new stores but the v13 build never reads them; existing v13 operations continue to function

#### Scenario: Failed upgrade aborts cleanly

- **GIVEN** an environment that simulates IDB quota exhaustion during the v13 → v14 upgrade
- **WHEN** the upgrade is attempted
- **THEN** the upgrade transaction aborts and the database remains at v13 with all v13 data intact; the SPA falls back to in-memory operation per the existing Storage degradation handling requirement

### Requirement: InMemory health repositories

The `InMemoryPersistenceAdapter` SHALL include `InMemoryHealthSleepRepository`, `InMemoryHealthWeightRepository`, `InMemoryHealthHrvRepository`, `InMemoryHealthDailyRepository`, `InMemoryHealthBodyCompositionRepository`, and `InMemoryHealthStressRepository`. Each implements its corresponding port interface using plain Maps/arrays, for use in unit tests of Health Hub pages and use cases.

#### Scenario: Unit test with health persistence

- **WHEN** a test of a Health Hub use case injects `InMemoryHealthSleepRepository`
- **THEN** the test can assert on the stored `HealthSleepRecord[]` synchronously without any IndexedDB or Dexie mocks

## MODIFIED Requirements

### Requirement: Persisted-entity reactive read pattern

Components in `@kaiord/workout-spa-editor` reading any persisted entity stored in the Dexie database (workouts, templates, profiles, AI providers, sync state, monthly usage, coachingActivities, coachingSyncState, the `meta` table, and the six health stores `healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`) SHALL obtain that data from a reactive query against Dexie — either inline via `useLiveQuery` (from `dexie-react-hooks`) or via a thin wrapping hook that uses it (such as `useActiveProfileLive`, `useLibraryTemplatesLive`, `useAiProvidersLive`, `useHealthSleepWeekLive`). Components SHALL NOT read these entities from a Zustand store mirror.

The reactive contract guarantees that any write to a Dexie table — including writes from application use cases that bypass Zustand entirely (such as `linkAccount` introduced by `train2go-profile-link`, or the new `importHealthFitFile` introduced by this change) — propagates to every consuming component on the next render without manual re-fetch or mirror synchronization. Hooks that compose multiple Dexie reads (such as `useActiveProfileLive`, which joins the `meta` table's `activeProfileId` with the `profiles` table) SHALL perform the join inside a single `useLiveQuery` callback so consumers in the same tab never observe an intermediate state where the active id references a profile that has not yet been observed. Cross-tab atomicity is not guaranteed by this requirement.

While the underlying query is loading on first mount, `useLiveQuery` returns `undefined`. Consumers SHALL treat `undefined` as the loading state (rendering an explicit fallback such as a skeleton or "Loading…" message) and SHALL NOT confuse it with the empty-data state (an empty array, `null`, or empty string). Live hooks reading `meta`-table values SHALL return `null` (not `""`) for the missing-row case so consumers can distinguish loading (`undefined`), missing (`null`), and empty (`""`).

#### Scenario: Connect Train2Go updates the calendar header in real time

- **WHEN** the user clicks "Connect Train2Go" in Profile Settings, the `linkAccount` use case persists the link via `PersistencePort.profiles.put`, and the toast confirming success fires after the use case's promise resolves
- **THEN** the calendar header's per-source Sync button SHALL appear without a manual remount or page refresh — the test verifies via `waitFor` against the rendered button

#### Scenario: Profiles, templates, and AI providers survive a page refresh

- **WHEN** the user refreshes the SPA after creating a profile, saving a template, and configuring an AI provider in the previous session
- **THEN** all three SHALL become visible in their respective UI surfaces (Profile Manager dialog, library badge and dialog, AI settings) after the initial loading state resolves, without the user being asked to recreate them; loading states use `useLiveQuery`'s `undefined` return value to render skeletons or "Loading…" messages until the data resolves

#### Scenario: Active profile join is observed atomically within a single tab

- **WHEN** the active profile changes from `A` to `B` via the `setActiveProfile` use case (which writes the `meta.activeProfileId` row) followed by an unrelated mutation to the `profiles` table within the same tab, with both observations propagated by `useLiveQuery`
- **THEN** every same-tab consumer of `useActiveProfileLive()` SHALL observe a single transition from `{id: "A", profile: ProfileA}` directly to `{id: "B", profile: ProfileB}` — never `{id: "B", profile: null}` or `{id: "B", profile: ProfileA}` as an intermediate render

#### Scenario: Health Hub sleep page sees an imported FIT sleep file in real time

- **WHEN** the user imports a Garmin FIT sleep file from the Settings → Import section, the `importHealthFitFile` use case persists the result via `persistence.healthSleep.upsertMany`, and the toast confirming success fires
- **THEN** the Health Hub `/health/sleep` page SHALL update without a manual remount or page refresh — the test verifies via `waitFor` that the new sleep record appears in the rendered list, with the `useHealthSleepWeekLive` hook handling the live-query subscription
