> Synced: 2026-06-22 (energy-balance-tracking)

# SPA Persistence Port

## Purpose

PersistencePort contract (workouts, templates, profiles, AI providers, sync state, monthly usage) and the Dexie adapter that backs editor-local state in IndexedDB.

## Requirements

### Requirement: PersistencePort interface

The system SHALL define a PersistencePort interface with repository types for workouts, templates, profiles, AI providers, sync state, and usage tracking. Stores and use cases SHALL depend on the port interface, never on Dexie directly.

The port SHALL also expose `transaction<T>(fn: () => Promise<T>): Promise<T>` for multi-write atomicity. Application use cases that perform two or more writes whose partial application would leave the persisted state inconsistent SHALL invoke this method and pass an async callback containing the writes; adapters guarantee atomic commit-or-rollback (the Dexie adapter via `db.transaction("rw", ...)`; the in-memory adapter via snapshot/revert).

#### Scenario: Store uses PersistencePort

- **WHEN** any application code needs to read or write persisted data
- **THEN** it SHALL call methods on PersistencePort repositories, not Dexie tables directly

#### Scenario: Multi-write use case uses port transaction

- **WHEN** an application use case performs two or more writes that must commit atomically (e.g., creating a profile and setting it active when no profile previously existed)
- **THEN** it SHALL wrap the writes in `await persistence.transaction(async () => { ... })` rather than calling individual repository methods sequentially

### Requirement: DexiePersistenceAdapter

The system SHALL provide a DexiePersistenceAdapter that implements PersistencePort using Dexie.js over IndexedDB. The adapter SHALL define a Dexie schema starting at version 1 with indexes on `[date]`, `[date+state]`, `[source+sourceId]`, `sport`, and `*tags` (multiEntry).

#### Scenario: Calendar week query

- **WHEN** the calendar requests workouts for a date range
- **THEN** the WorkoutRepository SHALL query using the `[date]` index and return all workouts within the range

#### Scenario: Dexie schema versioning

- **WHEN** the schema needs to change in a future release
- **THEN** the adapter SHALL use `db.version(N).stores({}).upgrade()` pattern to migrate existing data

### Requirement: InMemoryPersistenceAdapter

The system SHALL provide an InMemoryPersistenceAdapter for use in tests. It SHALL be located in `src/test-utils/in-memory-persistence.ts` and implement the same PersistencePort interface.

#### Scenario: Unit test with persistence

- **WHEN** a test needs to verify store behavior with persistence
- **THEN** it SHALL inject InMemoryPersistenceAdapter, which stores data in plain arrays/maps with no async latency

### Requirement: Storage degradation handling

The system SHALL probe IndexedDB availability on boot. If unavailable, the system SHALL fall back to in-memory operation with user-visible warnings.

#### Scenario: IndexedDB unavailable (private browsing)

- **WHEN** the Dexie probe write/read fails on app boot
- **THEN** the system SHALL display a persistent banner "Storage unavailable — changes in this session won't be saved", fall back to in-memory persistence, and make export buttons more prominent

### Requirement: AI provider encryption preservation

The AiProviderRepository SHALL preserve encryption for API keys. API keys SHALL never be stored in plaintext in any Dexie table.

#### Scenario: Save AI provider config

- **WHEN** an AI provider with an API key is saved via AiProviderRepository
- **THEN** the API key SHALL be encrypted before storage using the existing `createSecureStorage` mechanism or equivalent

### Requirement: Workout-store persistence boundary

The workout-store (Zustand) SHALL persist to Dexie only on explicit user actions (save to library, push to Garmin), never via automatic write-through. The workout-store is editor runtime state, not persisted data.

See also: the "No Zustand-to-Dexie write-through" requirement, which generalises the rule to all Zustand stores in `@kaiord/workout-spa-editor` and adds the static-guard enforcement.

#### Scenario: User edits a workout in the editor

- **WHEN** the user modifies steps, reorders, or uses undo/redo in the editor
- **THEN** changes SHALL remain in Zustand in-memory state only, with no Dexie writes

#### Scenario: User saves workout to library

- **WHEN** the user clicks "Save to Library" from the editor
- **THEN** the system SHALL write the current KRD to the templates table via `TemplateRepository`

### Requirement: CoachingRepository

The `PersistencePort` SHALL include a `coaching: CoachingRepository` repository for persisted coaching activities sourced from external coaching platforms (Train2Go, future TrainingPeaks, etc.).

`CoachingRepository` SHALL provide:

- `getById(id: string): Promise<CoachingActivityRecord | undefined>`
- `getByProfileAndDateRange(profileId: string, start: string, end: string): Promise<CoachingActivityRecord[]>`
- `getByProfileAndSourceId(profileId: string, source: string, sourceId: string): Promise<CoachingActivityRecord | undefined>`
- `upsertMany(records: CoachingActivityRecord[]): Promise<void>`
- `put(record: CoachingActivityRecord): Promise<void>`
- `delete(id: string): Promise<void>` — single-row delete used by `syncWeek` to clean up coach-removed activities within the synced week
- `deleteByProfile(profileId: string): Promise<void>` — cascade delete on profile removal

The composite primary key SHALL be `${profileId}:${source}:${sourceId}` to make upsert deterministic without a separate uniqueness check.

`getByProfileAndDateRange` SHALL be the only public read API used by the calendar; raw table access SHALL NOT be exposed for `coachingActivities`. This makes profile isolation a property of the port surface, not a discipline that must be applied at every call site.

#### Scenario: Calendar week query for coaching activities

- **WHEN** the calendar requests coaching activities for profile `p1` and date range `2026-04-13`..`2026-04-19`
- **THEN** `getByProfileAndDateRange("p1", "2026-04-13", "2026-04-19")` returns all matching `CoachingActivityRecord` rows via the `[profileId+date]` index

#### Scenario: Profile isolation on read

- **WHEN** profile `p1` and profile `p2` each have activities on date `2026-04-13`
- **THEN** `getByProfileAndDateRange("p1", "2026-04-13", "2026-04-13")` returns only `p1`'s activities; `p2`'s rows MUST NOT leak

#### Scenario: Upsert is idempotent

- **WHEN** `upsertMany` is called twice with the same set of records
- **THEN** the row count in `coachingActivities` does not grow on the second call

#### Scenario: Cascade delete by profile

- **WHEN** `deleteByProfile(profileId)` is called with the to-be-deleted profile's id
- **THEN** every row whose `profileId` matches is removed; rows owned by other profiles are untouched

#### Scenario: Single-row delete is a no-op for missing id

- **WHEN** `delete(id)` is called and no row with that `id` exists in `coachingActivities`
- **THEN** the call resolves successfully without raising (matters for `syncWeek` orphan cleanup tolerating concurrent deletes)

### Requirement: Profile.linkedAccounts persistence (storage round-trip)

The `profileSchema` SHALL include `linkedAccounts: LinkedCoachingAccount[]` (default `[]`). The `ProfileRepository.put` and `ProfileRepository.getAll`/`getById` SHALL round-trip this field without loss. (The domain semantics — uniqueness per source, link/unlink behavior — are defined in `spa-coaching-integration`.)

#### Scenario: Profile round-trips linked accounts

- **WHEN** a profile with `linkedAccounts: [{ source: "train2go", externalUserId: "28035", externalUserName: "Pablo", linkedAt: "2026-04-27T10:00:00.000Z" }]` is saved and reloaded
- **THEN** the reloaded profile has the same `linkedAccounts` array, byte-identical

#### Scenario: Existing profiles backfill on schema upgrade

- **WHEN** the Dexie schema upgrades from v3 to v4 and an existing profile row has no `linkedAccounts` field
- **THEN** the upgrade backfills `linkedAccounts: []` so all profiles satisfy the schema

### Requirement: CoachingSyncStateRepository

The system SHALL persist coaching staleness signals in a **separate** Dexie table `coachingSyncState`, distinct from the bridge-discovery `syncState` table (which is bridge-manifest-shaped — `extensionId`, `lastSeen`, `capabilities`, `protocolVersion` — and SHALL remain untouched by this change). Overloading the bridge-discovery `syncState` table for per-profile per-source staleness would force coaching writers to invent sentinel values for fields they do not own.

The `coachingSyncState` table SHALL be primary-keyed by the compound `[source+profileId]` and store rows of shape:

```json
{
  source: string,           // e.g., "train2go"
  profileId: string,        // owning Kaiord profile
  lastSyncedAt: string      // ISO datetime
}
```

A new repository `CoachingSyncStateRepository` SHALL be added to `PersistencePort`, providing at least:

- `getBySourceAndProfile(source: string, profileId: string): Promise<CoachingSyncStateRecord | undefined>`
- `put(record: CoachingSyncStateRecord): Promise<void>`
- `deleteByProfile(profileId: string): Promise<void>` — cascade on profile removal

Single-row reads MUST use `getBySourceAndProfile` (the compound primary key). Raw table access SHALL NOT be exposed.

#### Scenario: Coaching staleness lookup

- **WHEN** the calendar checks `lastSyncedAt` for `source: "train2go", profileId: "p1"`
- **THEN** `coachingSyncState.getBySourceAndProfile("train2go", "p1")` returns the row for `(train2go, p1)`, never matching another profile

#### Scenario: Bridge syncState unchanged

- **WHEN** the Dexie schema upgrades from v3 to v4
- **THEN** the v4 `syncState` store SHALL declare schema string `"source"` byte-identically to v1-v3 (no compound index sneaks in), and rows written by bridge-discovery code (Garmin push, etc.) continue to validate against the existing `syncStateSchema` without modification

#### Scenario: Cascade delete by profile

- **WHEN** profile P is deleted
- **THEN** `coachingSyncState.deleteByProfile(P)` is invoked and removes every row whose `profileId` matches; rows for other profiles remain untouched

### Requirement: Dexie v4 migration

The `DexiePersistenceAdapter` SHALL declare schema version 4 with:

- A new `coachingActivities` store keyed by `id`, with indexes `[profileId+date]`, `[profileId+source+sourceId]`, and `[profileId+source]`.
- A new `coachingSyncState` store primary-keyed by the compound `[source+profileId]`, with secondary indexes on `source` and `profileId`.
- An `.upgrade()` step that backfills `linkedAccounts: []` on every existing row in `profiles` that does not already have the field.
- All other tables (`workouts`, `templates`, `aiProviders`, `syncState`, `usage`, `meta`, `bridges`) carry their v3 schema strings unchanged. The bridge-discovery `syncState` is intentionally untouched.

#### Scenario: Fresh install at v4

- **WHEN** a new browser opens the app for the first time
- **THEN** Dexie creates the database directly at v4 with `coachingActivities` and `coachingSyncState` available

#### Scenario: Upgrade from v3 to v4

- **WHEN** an existing user with v3 data loads a build that ships v4
- **THEN** the database upgrades, every existing profile row gains `linkedAccounts: []`, the bridge `syncState` table is untouched, and no other data is rewritten

#### Scenario: Forward-tolerance of the linkedAccounts field on a v3 build

- **WHEN** a v4-migrated database is opened by a v3 build (rollback scenario)
- **THEN** Dexie preserves the unknown `linkedAccounts` field on profile rows; the v3 build ignores it without throwing

### Requirement: InMemoryCoachingRepository

The `InMemoryPersistenceAdapter` SHALL include an `InMemoryCoachingRepository` that implements the same `CoachingRepository` interface using plain Maps/arrays, for use in unit tests of stores and use cases.

#### Scenario: Unit test with coaching persistence

- **WHEN** a test of `syncWeek` injects `InMemoryCoachingRepository`
- **THEN** the test can assert on the stored `CoachingActivityRecord[]` synchronously without any IndexedDB or Dexie mocks

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

### Requirement: No Zustand-to-Dexie write-through

Among the Zustand stores in `@kaiord/workout-spa-editor`, only `useWorkoutStore` SHALL write to Dexie, and only on explicit user actions (Save to Library, Push to Garmin). All other Zustand stores in the package SHALL hold runtime-only state and SHALL NOT import from `adapters/dexie/dexie-database`, SHALL NOT import any helper named `persistState`, and SHALL NOT call `persistence.<repo>.put(...)` (or any equivalent persistence-write entry point) from within a store action. Persistence writes for profiles, library templates, AI providers, and any other persisted entity SHALL go through application-layer use cases that take a `PersistencePort` (or a specific repository from the port) as a dependency; components SHALL invoke those use cases directly via the `PersistenceProvider` context.

When a use case's persistence write rejects (e.g., Dexie quota exceeded, IDB transaction abort, encryption failure), the calling component SHALL surface a user-visible error indication (toast, inline banner, or equivalent) and SHALL NOT silently move to a stale-success state. Use cases SHALL propagate Dexie rejections (not swallow them with `.catch(console.error)`).

A static guard test under `scripts/check-no-zustand-writethrough.mjs` (executed in CI via `pnpm test:scripts`) SHALL enforce this rule by parsing imports of every file under `packages/workout-spa-editor/src/store/**` and failing the build if any non-allowlisted file imports `dexie-database` (rule R-DexieImport) or a `persistState` helper (rule R-PersistStateImport). The same script SHALL also scan every file under `packages/workout-spa-editor/src/application/**` and fail (rule R-AppDexieImport) if ANY file imports `dexie-database` directly — application code MUST access persistence via `PersistencePort` only, with no allowlist.

#### Scenario: Mechanical guard catches a `dexie-database` import in a non-allowlisted store

- **WHEN** a contributor adds a Zustand store under `packages/workout-spa-editor/src/store/**` whose source imports `../adapters/dexie/dexie-database` (or any path resolving to it — relative, alias, or barrel re-export), and the file is not on the allowlist
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule R-DexieImport, naming the offending file and the offending import path, blocking the merge

#### Scenario: Mechanical guard catches a `persistState` import in a non-allowlisted store

- **WHEN** a contributor adds a Zustand store under `packages/workout-spa-editor/src/store/**` whose source imports a sibling identifier named `persistState`, and the file is not on the allowlist
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule R-PersistStateImport, naming the offending file and the offending import, blocking the merge

#### Scenario: Allowlisted explicit-user-action write succeeds

- **WHEN** `useWorkoutStore`'s "Save to Library" action calls into a write helper that imports `dexie-database` (an allowlisted file path)
- **THEN** the static guard SHALL accept the import and pass

#### Scenario: Use case rejection surfaces as a user-visible error

- **WHEN** a component invokes an application use case (e.g., `await createProfile(persistence, name)`) and the underlying persistence write rejects (Dexie quota exceeded, simulated by injecting a rejecting `persistence.profiles.put` in a test)
- **THEN** the calling component SHALL render a user-visible error indication (toast or inline banner) AND SHALL NOT update the UI to a state implying success (no new profile in the live-query result, no navigation, no "saved" state flag)

#### Scenario: Reactive propagation across stores after a write through `PersistencePort`

- **WHEN** any application use case writes to a persisted entity via `persistence.<repo>.put(...)` (or the equivalent setter), with no Zustand involvement
- **THEN** every consumer reading via the corresponding live hook SHALL re-render with the new data without a manual remount, refresh, or re-subscribe — tests verify via `waitFor` against the live-hook return value

### Requirement: Persistence transactions for multi-write use cases

Application use cases that perform two or more writes whose partial application would leave the persisted state inconsistent (e.g., `createProfile` conditionally writing both a `profiles` row AND `meta.activeProfileId` on the first profile; `deleteProfile` deleting a `profiles` row AND clearing `meta.activeProfileId` if it matched) SHALL wrap their writes in `await persistence.transaction(async () => { ... })`. The Dexie adapter SHALL implement this by delegating to `db.transaction("rw", db.tables, fn)`. The in-memory adapter SHALL implement this with snapshot/revert semantics: capture all repo state before invoking `fn`, restore on rejection, fire any subscribed listeners only on successful commit. Application code SHALL NOT import `db` (or any path resolving to `dexie-database`) directly to obtain transactions; the broader rule that no application file imports Dexie is enforced by the same R-AppDexieImport static guard documented under "No Zustand-to-Dexie write-through".

#### Scenario: Multi-write use case rolls back on partial failure

- **WHEN** a use case (e.g., `createProfile`) wraps two writes in `await persistence.transaction(async () => { await persistence.profiles.put(profile); await persistence.profiles.setActiveId(profile.id); })` and the second write rejects (simulated by injecting a rejecting `setActiveId` in a test)
- **THEN** the persisted state SHALL contain neither the new profile (the first write is rolled back) nor the new active-id, AND the use case promise SHALL reject so the calling component surfaces a user-visible error indication

#### Scenario: Application use case does not import Dexie directly (mechanically enforced)

- **WHEN** a contributor adds a file under `packages/workout-spa-editor/src/application/**` whose source imports `../adapters/dexie/dexie-database` (or any path resolving to it)
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule R-AppDexieImport, naming the offending file and the offending import path, blocking the merge — application code accesses persistence via `PersistencePort` only

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

### Requirement: ChatMessageRepository

`PersistencePort` SHALL expose a `ChatMessageRepository` for chat transcripts with operations to append a message, list a profile's messages in `createdAt` order (optionally limited to the most recent N), list a single conversation's messages in `createdAt` order (optionally limited to the most recent N), delete every message for a `conversationId`, and bulk-delete every message for a profile. Records are profile- and conversation-scoped (`{ id, profileId, conversationId, role, content, toolName?, createdAt, usage? }`) with `createdAt` as an ISO-8601 string so the snapshot merge clock applies; rows are append-only (never updated in place). The store SHALL participate in the per-profile cascade delete and SHALL be included in the cloud-sync snapshot export, merged by `id` like other id-keyed tables. The per-profile bulk delete follows the existing per-profile cascade convention (no per-row tombstones — it runs independently on each device and propagates via the profile tombstone). An explicit single-conversation delete SHALL instead record one tombstone per deleted message (plus a `chatConversations` tombstone) so it propagates across devices instead of resurrecting on merge; that tombstoning lives in the `deleteConversation` use case (see the spa-chat-conversations capability), not in the repository.

#### Scenario: Chronological read per profile

- **WHEN** messages exist for profiles A and B and the chat page queries profile A's transcript
- **THEN** the repository SHALL return only profile A's messages ordered by `createdAt`

#### Scenario: Cascade delete on profile removal

- **WHEN** a profile is deleted
- **THEN** that profile's chat messages SHALL be removed by the same cascade that covers the other per-profile stores

#### Scenario: Transcript included in cloud-sync snapshot

- **WHEN** a cloud-sync snapshot export runs on a device with chat messages
- **THEN** the exported snapshot SHALL contain the `chatMessages` rows, and merging that snapshot on another device SHALL union the messages by `id` so both devices converge on the same transcript

#### Scenario: Deleted conversation messages do not resurrect on merge

- **GIVEN** device A and device B share the same synced transcript
- **WHEN** the user deletes a conversation on device A and a later sync merges device B's snapshot (which still contains the old messages)
- **THEN** the deleted messages SHALL remain deleted on both devices because the delete recorded a tombstone per deleted message plus a `chatConversations` tombstone

### Requirement: ChatConversationRepository port

The persistence port SHALL expose a `ChatConversationRepository` for the `chatConversations` store. It SHALL provide: append/put a conversation row; list a profile's conversations ordered by `updatedAt` descending; rename a conversation (updating `title` and advancing `updatedAt`); touch a conversation (advance `updatedAt` on activity); delete one conversation row; and bulk-delete every conversation for a profile (the profile-delete cascade path). Ids SHALL be caller-supplied (nanoid). The `chatConversations` table SHALL be included in the snapshot export and the tombstone surface.

#### Scenario: List ordered by recent activity

- **GIVEN** a profile has multiple conversations
- **WHEN** the caller lists the profile's conversations
- **THEN** rows SHALL be returned ordered by `updatedAt` descending

#### Scenario: Conversation row appears in snapshot export

- **WHEN** a snapshot is exported for a profile that has conversations
- **THEN** the export SHALL include the `chatConversations` rows so cross-device sync can merge them

### Requirement: Per-conversation message reads

The `ChatMessageRepository` SHALL support reading and deleting messages scoped to a single conversation: list a conversation's messages in ascending `createdAt` order (optionally limited to the most recent N, still oldest-to-newest), and delete every message for a given `conversationId`. The existing per-profile bulk delete used by the profile-delete cascade SHALL be retained.

#### Scenario: Read a conversation's messages

- **WHEN** the caller lists messages for a `(profileId, conversationId)` pair
- **THEN** only that conversation's messages SHALL be returned, in ascending `createdAt` order

#### Scenario: Delete a conversation's messages

- **WHEN** the caller deletes messages for a `conversationId`
- **THEN** only that conversation's messages SHALL be removed; other conversations' messages SHALL remain

### Requirement: Dexie v21 migration

The Dexie schema SHALL add version 21 introducing the `chatMessages` store with primary key `id` and indexes `profileId` and `[profileId+createdAt]`. The migration SHALL be purely additive: no existing table is rewritten and no data transform runs.

#### Scenario: Fresh install at v21

- **WHEN** the SPA initializes IndexedDB on a device with no prior database
- **THEN** the database SHALL open at version 21 with the `chatMessages` store present and all pre-existing stores unchanged

#### Scenario: Upgrade from an earlier version to v21

- **WHEN** a device with a pre-v21 database loads the new build
- **THEN** the database SHALL upgrade to v21 adding the empty `chatMessages` store while preserving all existing rows in every other store

### Requirement: InMemoryChatMessageRepository

The in-memory persistence adapter SHALL implement `ChatMessageRepository` with the same observable behavior so chat use cases and components are unit-testable without IndexedDB.

#### Scenario: Unit test with chat persistence

- **WHEN** a chat use-case test appends and lists messages through the in-memory adapter
- **THEN** the results SHALL match the Dexie adapter's contract (profile scoping, chronological order, clear semantics)

### Requirement: AiModelBindingRepository

`PersistencePort` SHALL expose an `AiModelBindingRepository` for per-profile model bindings
with operations to put a binding, get one binding by `(profileId, purpose)`, list all
bindings for a profile, and delete one binding. Records are profile-scoped
(`{ profileId, purpose, providerId, modelId, updatedAt }`) where `purpose` is one of
`default | chat | workout_generation`, keyed by the compound `[profileId+purpose]` so each
purpose has at most one binding per profile. The store SHALL participate in the per-profile
cascade delete and SHALL be included in the cloud-sync snapshot export. Stores and use cases
SHALL depend on the port interface, never on the Dexie table directly.

#### Scenario: One binding per purpose per profile

- **WHEN** a binding for `(profile A, chat)` is put twice with different `modelId` values
- **THEN** the repository SHALL retain a single `(profile A, chat)` row reflecting the latest
  put

#### Scenario: List bindings per profile

- **WHEN** bindings exist for profiles A and B and the Models settings reads profile A's
  bindings
- **THEN** the repository SHALL return only profile A's bindings

#### Scenario: Cascade delete on profile removal

- **WHEN** a profile is deleted
- **THEN** that profile's model bindings SHALL be removed by the same cascade that covers the
  other per-profile stores

#### Scenario: Bindings included in cloud-sync snapshot

- **WHEN** a cloud-sync snapshot export runs on a device with model bindings
- **THEN** the exported snapshot SHALL contain the `aiModelBindings` rows so they merge on
  other devices

### Requirement: Dexie v22 migration

The Dexie schema SHALL add version 22 introducing the `aiModelBindings` store with compound
primary key `[profileId+purpose]` and index `profileId`. The migration SHALL be additive for
existing stores and SHALL backfill a `default` binding for each profile that has at least one
configured provider, seeded from that profile's `isDefault` provider (or the first provider)
and that provider's existing `model`, so AI features behave identically immediately after
upgrade. The backfill SHALL be idempotent.

#### Scenario: Fresh install at v22

- **WHEN** the SPA initializes IndexedDB on a device with no prior database
- **THEN** the database SHALL open at version 22 with the `aiModelBindings` store present and
  all pre-existing stores unchanged

#### Scenario: Upgrade backfills the default binding

- **GIVEN** a pre-v22 database with at least one configured provider carrying a `model`
- **WHEN** the device loads the new build
- **THEN** the database SHALL upgrade to v22 and SHALL contain a `default` binding seeded from
  the existing default provider's id and model, while preserving all other stores' rows

#### Scenario: Upgrade with no providers adds an empty store

- **GIVEN** a pre-v22 database with zero configured providers
- **WHEN** the device loads the new build
- **THEN** the database SHALL upgrade to v22 with an empty `aiModelBindings` store and no
  binding rows

### Requirement: InMemoryAiModelBindingRepository

The in-memory persistence adapter SHALL implement `AiModelBindingRepository` with the same
observable behavior so model-binding use cases and components are unit-testable without
IndexedDB.

#### Scenario: Unit test with model-binding persistence

- **WHEN** a use-case test puts and reads bindings through the in-memory adapter
- **THEN** the results SHALL match the Dexie adapter's contract (profile scoping, one row per
  `(profileId, purpose)`, delete semantics)

### Requirement: Energy and intake stores

The persistence layer SHALL provide device-local stores for `intakeEntries`
(indexed by `[profileId+date]`), `intakePresets` (indexed by `profileId`), and
`energyTargets` (per profile), introduced via a Dexie **v25** upgrade following the
existing versioned-schema migration pattern with a co-located migration test. These
stores SHALL be excluded from the cloud snapshot.

#### Scenario: New stores available after v25 upgrade

- **GIVEN** a database upgraded to Dexie v25
- **WHEN** the app reads the schema
- **THEN** `intakeEntries`, `intakePresets`, and `energyTargets` stores exist with their declared indexes

#### Scenario: Energy and intake stores excluded from snapshot

- **GIVEN** populated `intakeEntries`, `intakePresets`, and `energyTargets` stores
- **WHEN** a cloud snapshot is produced
- **THEN** none of these stores' rows appear in the snapshot
