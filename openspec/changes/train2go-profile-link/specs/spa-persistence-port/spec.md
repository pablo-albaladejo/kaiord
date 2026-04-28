## ADDED Requirements

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

#### Scenario: Calendar week query

- **WHEN** the calendar requests coaching activities for profile `p1` and date range `2026-04-13`..`2026-04-19`
- **THEN** `getByProfileAndDateRange("p1", "2026-04-13", "2026-04-19")` returns all matching `CoachingActivityRecord` rows via the `[profileId+date]` index

#### Scenario: Profile isolation on read

- **WHEN** profile `p1` and profile `p2` each have activities on date `2026-04-13`
- **THEN** `getByProfileAndDateRange("p1", "2026-04-13", "2026-04-13")` returns only `p1`'s activities; `p2`'s rows MUST NOT leak

#### Scenario: Upsert is idempotent

- **WHEN** `upsertMany` is called twice with the same set of records
- **THEN** the rowcount in `coachingActivities` does not grow on the second call

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

```
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
